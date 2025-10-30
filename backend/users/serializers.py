from rest_framework import serializers
from .models import User, UserType, Bookmark, AuthorPersona, SectionPreference
from articles.models import Section

class AuthorPersonaSerializer(serializers.Serializer):
    tone = serializers.CharField(required=True)
    style = serializers.CharField(required=True)
    length = serializers.CharField(required=True)
    extra_instructions = serializers.CharField(required=False, allow_null=True)

    def create(self, validated_data):
        return AuthorPersona(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        return instance

class SectionPreferenceSerializer(serializers.Serializer):
    section_id = serializers.CharField(required=True)
    section_name = serializers.CharField(read_only=True)
    score = serializers.FloatField(read_only=True)

    def create(self, validated_data):
        section = Section.objects.get(section_id=validated_data['section_id'])
        return SectionPreference.from_section(section)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        return instance

class UserSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.CharField(read_only=True)
    persona = AuthorPersonaSerializer()
    preferred_sections = SectionPreferenceSerializer(many=True)

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
