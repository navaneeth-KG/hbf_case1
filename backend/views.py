import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.contrib.gis.geos import Point 
from .models import Facility
from .serializers import FacilitySerializer 
from django.contrib.gis.db.models.functions import Distance
import openrouteservice  
from django.http import JsonResponse
import math
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.gis.measure import Distance
from django.views import View
import requests
import polyline





ORS_API_KEY = "5b3ce3597851110001cf624826988b3caeb94181835e04510cef9d76"
ors_client = openrouteservice.Client(key=ORS_API_KEY)
ORS_API_URL = "https://api.openrouteservice.org/v2/matrix/driving-car"

def get_route(user_location, facility_location):
    try:
        # Request route
        response = ors_client.directions(
            coordinates=[user_location, facility_location],
            profile='driving-car',
            format='geojson',
        )
        return response
    except Exception as e:
        return {"error": str(e)}


EARTH_RADIUS = 6371  # Earth radius in kilometers

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees).
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = EARTH_RADIUS * c  # in kilometers
    return distance

    



class NearestFacilityRouteView(View):
    def get(self, request, *args, **kwargs):
        try:
            # Get user location from query parameters
            user_lat = request.GET.get("lat")
            user_lng = request.GET.get("lng")

            if not user_lat or not user_lng:
                return JsonResponse({"error": "Latitude and longitude are required."}, status=400)

            user_lat = float(user_lat)
            user_lng = float(user_lng)

            # Specify the radius for facility search (e.g., 100 km)
            radius = 50  # in kilometers

            # Get all facilities
            all_facilities = Facility.objects.all()

            # Filter facilities within the radius using Haversine
            nearby_facilities = []
            for facility in all_facilities:
                facility_lat = facility.location.y
                facility_lng = facility.location.x
                distance = haversine(user_lat, user_lng, facility_lat, facility_lng)
                if distance <= radius:
                    nearby_facilities.append(facility)

            if not nearby_facilities:
                return JsonResponse({"error": "No nearby facilities found."}, status=404)

            # Prepare the list of locations for the matrix request
            user_location = [user_lng, user_lat]
            facility_coords = [[facility.location.x, facility.location.y] for facility in nearby_facilities]

            # Construct the payload for the ORS Matrix API
            payload = {
                "locations": [user_location] + facility_coords,
                "metrics": ["distance"],  # Calculate only the road distance
                "units": "m",  # Distance in meters
            }
            headers = {
                "Authorization": ORS_API_KEY,
                "Content-Type": "application/json",
            }
            # Make the request to OpenRouteService
            response = requests.post(ORS_API_URL, json=payload, headers=headers)
            if response.status_code != 200:
                return JsonResponse({"error": f"ORS API error: {response.json()}"}, status=response.status_code)

            matrix_response = response.json()

            print(matrix_response)

            # Extract the nearest facility and its distance
            distances = matrix_response.get("distances", [])
            if not distances:
                return JsonResponse({"error": "No distances found in the ORS response."}, status=404)

            # Get the road distances from the response
            distances = distances[0][1:]  # Skip the user's own distance
            min_distance = min(distances)
            nearest_index = distances.index(min_distance)
            nearest_facility = nearby_facilities[nearest_index]
            
            # print(nearest_facility.location.x)
            # Get the route to the nearest facility
            nearest_facility_location = [nearest_facility.location.x, nearest_facility.location.y]
            route = get_route(user_location, nearest_facility_location)

            # print(route)

           

            # Return the nearest facility and the route
            return JsonResponse({
                "facility": {
                    "id": nearest_facility.id,
                    "name": nearest_facility.name,
                    "latitude": nearest_facility.location.y,
                    "longitude": nearest_facility.location.x,
                    "road_distance_meters": min_distance * 1000,  # Convert km to meters
                },
                "route":route,
            })

        except Exception as e:
            import traceback
            print(traceback.format_exc())  # Debugging
            return JsonResponse({"error": str(e)}, status=500)






class FacilityListView(APIView):
    def get(self, request, *args, **kwargs):
        facilities = Facility.objects.all()
        serializer = FacilitySerializer(facilities, many=True)
        return Response(serializer.data)




class FacilityUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')

        if not file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Read the Excel file
            df = pd.read_excel(file)

            # Debug: Print the uploaded data for inspection
            print("Uploaded DataFrame:")
            print(df.head())

            # Data Cleaning and Validation
            df.dropna(subset=['Latitude', 'longitude'], inplace=True)  # Drop rows with missing coordinates
            df['Latitude'] = pd.to_numeric(df['Latitude'], errors='coerce')
            df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
            df = df[(df['Latitude'] >= -90) & (df['Latitude'] <= 90) & 
                    (df['longitude'] >= -180) & (df['longitude'] <= 180)]  # Filter invalid coordinates

            for _, row in df.iterrows():
                # Debug: Print each row being processed
                print(f"Processing row: {row}")

                location = Point(row['longitude'], row['Latitude'])
                Facility.objects.create(
                    name=row['Facility Name'],
                    facility_type=row['Facility Type'],
                    latitude=row['Latitude'],
                    longitude=row['longitude'],
                    location=location
                )

            return Response({"message": "Facilities uploaded successfully!"}, status=status.HTTP_201_CREATED) 

        except Exception as e:
            import traceback
            print(traceback.format_exc())  # Debug: Print detailed exception traceback
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# API view to handle route requests to a user-selected facility
@method_decorator(csrf_exempt, name='dispatch')
class RouteToSelectedFacility(APIView):
    def get(self, request, *args, **kwargs):
        try:
            # Get user location from query parameters
            user_lat = float(request.GET.get("lat"))
            user_lng = float(request.GET.get("lng"))

            # Get the facility ID from query parameters
            facility_id = request.GET.get("facility_id")
            if not facility_id:
                return JsonResponse({"error": "Facility ID is required"}, status=400)

            # Fetch the selected facility from the database
            try:
                selected_facility = Facility.objects.get(id=facility_id)
                print(selected_facility.location)
            except Facility.DoesNotExist:
                return JsonResponse({"error": "Facility not found"}, status=404)

            # Prepare user location and facility location
            user_location = [user_lng, user_lat]
            facility_location = [selected_facility.location.x, selected_facility.location.y]

            # Get route using OpenRouteService
            route = get_route(user_location, facility_location)

            # Return the route and facility information
            return JsonResponse({
                "facility": {
                    "name": selected_facility.name,
                    "latitude": selected_facility.location.y,
                    "longitude": selected_facility.location.x,
                },
                "route": route,
            })

        except Exception as e:
            import traceback
            print(traceback.format_exc())  # Debugging
            return JsonResponse({"error": str(e)}, status=500)
