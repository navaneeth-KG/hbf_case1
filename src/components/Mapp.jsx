import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
import axios from "axios";
import './Mapp.css'

const customIcon = new L.Icon({
  iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJUAAACUCAMAAACtIJvYAAAAwFBMVEX////p7/TT2d1co9mMmqLiS0s+Q0fq7/SCkZrZ3uDq7e/k6u5YodiBtN9OndfX2904PUFqqtycv9rA0NzM1d2VutvDy9DiPz/hmJp0eHz1+/9wcnVESU7Z5vDiR0f19/epxdujqKxVXWL98/PkYGDL3u376+stMzjvpqb54uLuz9ObnJ/0xsbkWlrofHwxQ0fgLi7nbW3xtLTriIjrkJCxtbjBTk8hKS92RUjWSUqGeXzZZ2jq19s7ldWxSElLREeQmec6AAAEZElEQVR4nO2aa0OiQBSGJZdY80plbFtN7eriJUgEK7v//3+1SM0FYQYShmM57yc9gefpHThzZqBWU6pcA9u2B9AQcU3GwXw4HM6D8QQaBWvgu56F3mV5rm9DA63kzC2kUyFr6EAj1QYLj2WKuLwF9AU2t/SkrDko0yAVKsQaQroVUKjoYqdYARyU71F7gsViEdCvng8FZbvEHBQN2WBIAy5UgRgz47dOpVtjICodCaiQDgPlMFdVkkr3YIrpwhJSWQsQqjnCNcGyLDeicsNPuD4gkFJqY2Omk5WiWPRpiu2DuAsn73UB6evJbf3jDxBdDbaERxWaCEA1yaSC8CpzBF0IKlIGblYKonswiD6zxaJy3ZDKENYGXBlo54BuIKBqfkYVheka7AwqieXq9oyr0zsh1d0p/9TbglTX9z2ulkKqJf/E++uiVKN9rmavTJPnO47jM23g64x/4kgm1f7bA+NWrG/XH94E58mlmjFjuKalwCrJVHwsIVQJVIKrPdRs+bC+dA4H82E5E55V+Gq/PTsV6/EJxbkQenrMOKdwZcD6zZczt8j+R9iWzh3BsSXRfMjQBGpOF+6KJ2Rzg2lTdKhRHdVKz47v+85z1mEVU+WUooKmMqhiyfKGZXvVTP/CCcv1qm9i1ZlUWpuE2xrzD9RJuC+RKkzfwurQwTI0k4RNSmUYHRLGsHK8arfqH+qwg2riMEulGR18sFQqI0YV8yqFyqiISnmVn+oreEWzw1Ipr/JTfQWv4O/BS+xVB+uFsUozSdhkwy8kjKkuP5V1nP5EjWiqlaOpOM3aYxYxFUKEasP+ilCh5PJxUyodleaVEEpRSaMq72r/HJVnCVUalTiNF6dyxqF+8ZW5KM6pZ0GOFULymeLBHl/CzYNPqCnIcZBaSb8uFadcAlNd/CNisS6pNGFYBpXBzM4dNr2JV37x2ZmsB8PZWaZXRfsrSV4V7K82p+pSSfMqLYeQ6uiK6liWV0yOozxU3UO6Z9E5ilOV5tXxC83R7+ajqpPMa1SleXVMc7S+KVV5I6i8AvOKTiIb7UDK8eqwTcR61cb7svU2E6W7tfW1ebBcKpaE/XxBpQnDcrwqKkWlqBSVotpxqoJ7fbvkFX2WasZmZ+ZZKmMVPbgvlYp9lsrkT+1ktIo6GdWLKq+UV8or5dX384qdcVq8GYfKaDEzjiaRill3Zq9SjcpWqZyHAHnDu9RfKapCVEZS4FSNP2lqwFIZe71R4vX1UW+PZ1dVVOcp7/qfK6oII35Ji6mgVqnb4VWf7iHnoKIHy1ylJt/4FVFVt9++3l8JvQLrRTO8qoTqK3i1LVTKq+/llboHt9Yr0VsWL0Q55kF6cILqs29ZXJlkTjWL9QwpjQOmYnIc5qHao6/TMCq5v2JF8pX3Xt+G/VWqFNXuUfGyhFS9BFSPT2XkpGoSdU/44v1S4+Rvmk4avBMEOboUpfazmH6kq+Cv1jg/CytFlV+KKr+2lKrgPSxHtcY2KnXuAdd/9UJp5igYVFMAAAAASUVORK5CYII=",
  iconSize: [25, 25],
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  iconSize: [25, 25],
});

const RoutingControl = ({ startLocation, endLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (!startLocation || !endLocation) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(startLocation.lat, startLocation.lng),
        L.latLng(endLocation.lat, endLocation.lng),
      ],
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, startLocation, endLocation]);

  return null;
};

const Mapp = () => {
  const [facilitiesData, setFacilitiesData] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [currentMode, setCurrentMode] = useState("user");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [distanceRange, setDistanceRange] = useState(5);
  const [nearestFacility, setNearestFacility] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://192.168.16.51:8000/facilities/");
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

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting user location:", error);
        setUserLocation({ lat: 37.7749, lng: -122.4194 }); // Fallback location
      }
    );
  }, []);

  const haversineDistance = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLng = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  

  useEffect(() => {
    let referenceLocation;
    switch (currentMode) {
      case "user":
        referenceLocation = userLocation;
        break;
      case "facility":
        referenceLocation = selectedFacility;
        break;
      case "search":
        referenceLocation = searchLocation;
        break;
      default:
        referenceLocation = null;
    }

    if (referenceLocation) {
      const filtered = facilitiesData.filter((facility) => {
        const distance = haversineDistance(referenceLocation, {
          lat: facility.latitude,
          lng: facility.longitude,
        });
        return distance <= distanceRange;
      });
      setFilteredFacilities(filtered);
    }
  }, [currentMode, userLocation, selectedFacility, searchLocation, distanceRange, facilitiesData]);
  
  console.log(selectedFacility)
  const handleFacilityClick = (facility) => {
    setSelectedFacility({
      lat: facility.latitude,
      lng: facility.longitude,
    });
    setCurrentMode("facility");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const place = e.target.elements.place.value;

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${place}&format=json&addressdetails=1`
      );

      if (response.data.length > 0) {
        const location = {
          lat: parseFloat(response.data[0].lat),
          lng: parseFloat(response.data[0].lon),
        };
        setSearchLocation(location);
        setCurrentMode("search");
      } else {
        alert("Location not found");
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  return (
    <div className="mapp">
      <nav>
        <form onSubmit={handleSearch}>
          <input type="text" name="place" placeholder="Search location" className="location-input"/>
          <button type="submit">search</button>
        </form>
        <div>
          <label>
            <input
              type="radio"
              name="mode"
              value="user"
              checked={currentMode === "user"}
              onChange={() => setCurrentMode("user")}
            />
            user location
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="facility"
              checked={currentMode === "facility"}
              onChange={() => setCurrentMode("facility")}
            />
            facility location
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="search"
              checked={currentMode === "search"}
              onChange={() => setCurrentMode("search")}
            />
            search location
          </label>
        </div>
        <div>
        <input
          type="range"
          min="5"
          max="50"
          step="5"
          value={distanceRange}
          onChange={(e) => setDistanceRange(Number(e.target.value))}
        />
        <span>{distanceRange} km</span></div>
        {/* <p>{selectedFacility!= null?selectedFacility.lat:''}</p> */}
       
      </nav>

      <MapContainer
        center={userLocation || [11.13394, 79.07547]}
        zoom={10}
        style={{ height: "90vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // attribution="&copy; OpenStreetMap contributors"
        />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>You</Popup>
          </Marker>
        )}

        {filteredFacilities.map((facility) => (
          <Marker
            key={facility.id}
            position={[facility.latitude, facility.longitude]}
            icon={customIcon}
            eventHandlers={{
              click: () => handleFacilityClick(facility),
              mouseover: (e) => {
                e.target.openPopup(); // Open the popup when hovering over the marker
              },
              mouseout: (e) => {
                e.target.closePopup(); // Close the popup when the mouse leaves the marker
              },
            }}
          >
            <Popup>
              <strong>{facility.name}</strong>
              <br />
              Type: {facility.facility_type}
            </Popup>
          </Marker>
        ))}

        {nearestFacility && (
          <RoutingControl
            startLocation={
              currentMode === "user"
                ? userLocation
                : currentMode === "facility"
                ? selectedFacility
                : searchLocation
            }
            endLocation={{
              lat: nearestFacility.latitude,
              lng: nearestFacility.longitude,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default Mapp;

