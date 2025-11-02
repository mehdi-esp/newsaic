from rest_framework import serializers
from .models import User, UserType, Bookmark, AuthorPersona, SectionPreference
from articles.models import Section

class AuthorPersonaSerializer(serializers.Serializer):
    tone = serializers.CharField(required=True, allow_blank=False)
    style = serializers.CharField(required=True, allow_blank=False)
    length = serializers.CharField(required=True, allow_blank=False)
    extra_instructions = serializers.CharField(required=False, allow_blank=False, allow_null=True)

    def create(self, validated_data):
        return AuthorPersona(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        return instance

class SectionPreferenceListSerializer(serializers.ListSerializer):

    def validate(self, data):

        min_sections = 1
        if len(data) < min_sections:
            raise serializers.ValidationError(
                f"At least {min_sections} section(s) must be provided."
            )

        section_ids = [item['section_id'] for item in data]
        unique_section_ids = set(section_ids)
        if len(section_ids) != len(unique_section_ids):
            raise serializers.ValidationError("Duplicate section_ids are not allowed.")

        found_sections = Section.objects.filter(
            section_id__in=unique_section_ids
        ).count()

        if found_sections != len(unique_section_ids):
            raise serializers.ValidationError(
                "One or more provided section_ids do not exist."
            )

        return data

    def create(self, validated_data):

        section_ids = [item['section_id'] for item in validated_data]

        sections = Section.objects.filter(section_id__in=section_ids)

        sections_map = {s.section_id: s for s in sections}

        created_sections = []
        for item in validated_data:
            section_model = sections_map[item['section_id']]
            created_sections.append(SectionPreference.from_section(section_model))

        return created_sections

    def update(self, instance, validated_data):

        existing_sections_map = {s.section_id: s for s in instance}

        incoming_section_ids = [item['section_id'] for item in validated_data]

        sections = Section.objects.filter(section_id__in=incoming_section_ids)
        sections_map = {s.section_id: s for s in sections}

        updated_sections = []
        for item in validated_data:
            section_id = item['section_id']

            section_model = sections_map[section_id]

            if section_id in existing_sections_map:
                section_pref = existing_sections_map[section_id]
                section_pref.section_name = section_model.web_title
            else:
                section_pref = SectionPreference.from_section(section_model)

            updated_sections.append(section_pref)

        return updated_sections

class SectionPreferenceSerializer(serializers.Serializer):
    section_id = serializers.CharField(required=True)
    section_name = serializers.CharField(read_only=True)
    score = serializers.FloatField(read_only=True)

    class Meta:
        list_serializer_class = SectionPreferenceListSerializer

class ReaderSectionPreferencesSerializer(serializers.ModelSerializer):
    preferred_sections = SectionPreferenceSerializer(many=True, required=True, allow_null=False)

    class Meta:
        model = User
        fields = ['preferred_sections']

    def update(self, instance, validated_data):
        sections_data = validated_data.pop('preferred_sections')

        current_sections = instance.preferred_sections or []

        sections_field_serializer = self.fields['preferred_sections']

        updated_sections_list = sections_field_serializer.update(
            current_sections, sections_data
        )

        instance.preferred_sections = updated_sections_list

        instance.save()
        return instance

class UserSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.CharField(read_only=True)
    persona = AuthorPersonaSerializer(read_only=True)
    preferred_sections = SectionPreferenceSerializer(read_only=True, many=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'user_type', 'gender', 'birthday', 'persona', 'preferred_sections'
        ]
        read_only_fields = ['user_type', 'persona', 'preferred_sections']

    def validate(self, attrs):
        # Determine the user_type: from incoming data or existing instance
        user_type = attrs.get('user_type', getattr(self.instance, 'user_type', None))

        # Only consider fields that are actually being updated
        gender = attrs.get('gender') if 'gender' in attrs else getattr(self.instance, 'gender', None)
        birthday = attrs.get('birthday') if 'birthday' in attrs else getattr(self.instance, 'birthday', None)

        if user_type == UserType.READER:
            # For readers, require these fields if creating or updating them explicitly
            if self.instance is None or 'gender' in attrs:
                if not gender:
                    raise serializers.ValidationError({"gender": "Gender is required for news readers."})
            if self.instance is None or 'birthday' in attrs:
                if not birthday:
                    raise serializers.ValidationError({"birthday": "Birthday is required for news readers."})
        else:
            # Admins cannot have these fields set
            errors = {}
            if 'gender' in attrs and gender:
                errors['gender'] = "Admins cannot have gender set."
            if 'birthday' in attrs and birthday:
                errors['birthday'] = "Admins cannot have birthday set."
            if errors:
                raise serializers.ValidationError(errors)

        return attrs


class BookmarkSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Bookmark
        fields = '__all__'
