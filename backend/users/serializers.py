from rest_framework import serializers
from .models import User, UserType, Bookmark

class UserSerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.CharField(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'user_type', 'gender', 'birthday']
        read_only_fields = ['user_type']

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
