from django.urls import path
from .views import FacilityListView
from .views import FacilityUploadView
from .views import NearestFacilityRouteView
from .views import  RouteToSelectedFacility


urlpatterns = [
    
    path('', FacilityListView.as_view(), name='facilities-list'),
    path('upload-facilities/', FacilityUploadView.as_view(), name='upload-facilities'),
    path('route/',NearestFacilityRouteView.as_view(), name='route_to_nearest_facility'),
    path('route2/', RouteToSelectedFacility.as_view(), name='route_to_selected_facility'),
    
]
