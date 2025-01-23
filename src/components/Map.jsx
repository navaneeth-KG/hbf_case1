import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

const customIcon = new L.Icon({
  iconUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLlWVIBFvO-lrCRHYxbLzl9qIeleGW8yN6iw&s",
  iconSize: [25, 25],
});

const MapComponent = () => {
  const [facilitiesData, setFacilitiesData] = useState([]);
  const [currentZoom, setCurrentZoom] = useState(10); 
  const [sourceLocation, setSourceLocation] = useState({ type: '', lat: null, lng: null });
  const [route, setRoute] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [ distance ,setDistance] = useState(null)
  const [ time ,setTime] = useState(null)

  const ZoomHandler = () => {
    useMapEvents({
      zoomend: (event) => {
        const newZoom = event.target.getZoom();
        setCurrentZoom(newZoom); 
      },
    });
    return null;
  };

  const getlocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSourceLocation({
          type: 'userCurrentLocation',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };

  const fetchRoute = async (lat, lng) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/facilities/route?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      console.log(data)

      const geometry = {
        type: "LineString",
        coordinates: data.route.features[0].geometry.coordinates,
      };
      setRoute(null);
      setTimeout(() => {
        setRoute(geometry);
        setSelectedFacility(data.facility);
        setTime(data.route.features[0].properties.summary.duration)
        setDistance(data.route.features[0].properties.summary.distance)
        
      }, 0);
     
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };


  const fetchRoute2 = async (lat,lng,id) =>{
    try {
      const response = await fetch(`http://127.0.0.1:8000/facilities/route2?lat=${lat}&lng=${lng}&facility_id=${id}`)
      const data = await response.json();
      console.log(data)
      const geometry = {
        type: "LineString",
        coordinates: data.route.features[0].geometry.coordinates,
      };
      setRoute(null);
      
      setTimeout(() => {
        setRoute(geometry);
        setSelectedFacility(data.facility);
        setTime(data.route.features[0].properties.summary.duration)
        setDistance(data.route.features[0].properties.summary.distance)
      }, 0);
     
      
    } catch (error) {
      console.error("Error fetching route:", error);
    }



  }

  useEffect(() => {
    console.log("Route state updated:", route);
  }, [route]);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/facilities/");
        const parsedFacilities = response.data.features.map((item) => {
          const coordinates = item.geometry
            .match(/POINT \(([^)]+)\)/)[1]
            .split(" ");
          return {
            id: item.id,
            name: item.properties.name,
            facility_type: item.properties.facility_type,
            latitude: parseFloat(coordinates[1]),
            longitude: parseFloat(coordinates[0]),
          };
        });
        setFacilitiesData(parsedFacilities);
      } catch (error) {
        console.error("Error fetching facilities:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <button onClick={getlocation}>Get My Location</button>
      <button
        onClick={() => {
          if (sourceLocation.lat != null && sourceLocation.lng != null) {
            fetchRoute(sourceLocation.lat, sourceLocation.lng);
          }
        }}
        
      >
        Show Nearest Facility
      </button>
      <div>

      <h2>nearest/selected health facility:{selectedFacility&&selectedFacility.name}</h2>
      <h2>duration:{time?time:''} sec</h2>
      <h2>distance:{distance?distance:''} m</h2>
      </div>
      <MapContainer
        center={[11.13394, 79.07547]}
        zoom={9}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <ZoomHandler />

        {route && (
          <GeoJSON
            data={route}
            style={{
              color: "red",
              weight: 4,
            }}
          />
        )}

        {sourceLocation.type === 'userCurrentLocation' && (
          <Marker position={[sourceLocation.lat, sourceLocation.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {currentZoom >= 10 &&
          facilitiesData.map((facility) => (
            <Marker
              key={facility.id}
              position={[facility.latitude, facility.longitude]}
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  fetchRoute2(sourceLocation.lat, sourceLocation.lng, facility.id)
                  
                  console.log("Marker clicked:", facility.name);
                  
                },
              }}
              
            >
              {/* <Popup>
                <strong>{facility.name}</strong>
                <br />
                Type: {facility.facility_type}
              </Popup> */}
            </Marker>
          ))}
      </MapContainer>
    </>
  );
};

export default MapComponent;

