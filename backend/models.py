
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point

class Facility(models.Model):
    name = models.CharField(max_length=200)
    facility_type = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    location = models.PointField(geography=True, null=True, blank=True) 

    def save(self, *args, **kwargs):
        if not self.location and self.latitude and self.longitude:
            self.location = Point(self.longitude, self.latitude) 
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
















# from django.db import models

# class Facility(models.Model):
#     name = models.CharField(max_length=254)
#     facility_type = models.CharField(max_length=255)
#     district = models.CharField(max_length=255)
#     latitude = models.FloatField()
#     longitude = models.FloatField()

#     def __str__(self):
#         return self.name
# from django.contrib.gis.db import models

# class Facility(models.Model):
#     name = models.CharField(max_length=200)
#     facility_type = models.CharField(max_length=200)
#     latitude = models.FloatField()
#     longitude = models.FloatField()
#     location = models.PointField(null=True, blank=True)  # GeoDjango point field for storing coordinates

#     def __str__(self):
#         return self.name