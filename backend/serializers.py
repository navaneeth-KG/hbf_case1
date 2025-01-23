# from rest_framework import serializers
# from .models import Facility

# class FacilitySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Facility
#         fields = ['id', 'name', 'facility_type', 'district', 'latitude', 'longitude']

# from rest_framework_gis import serializers
# from .models import Facility

# class FacilitySerializer(serializers.GeoFeatureModelSerializer):
#     class Meta:
#         model = Facility
#         fields = ('id', 'name', 'facility_type', 'latitude', 'longitude', 'location')
# from rest_framework_gis import serializers
# from .models import Facility

# class FacilitySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Facility
#         fields = '__all__'  # Or specify the fields you want to serialize
#         geo_field = 'location'  # Set this to the name of your geographical field


from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Facility

class FacilitySerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Facility
        geo_field = 'location'
        fields = '__all__'