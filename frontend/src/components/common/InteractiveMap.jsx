import React from "react";
import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";

const Maps_API_KEY = "LA_TUA_STESSA_CHIAVE_API";

const InteractiveMap = ({ events, center, zoom, height }) => {
  const containerStyle = {
    width: "100%",
    height: height || "400px",
    borderRadius: "8px",
  };

  return (
    <LoadScript googleMapsApiKey={Maps_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={zoom}>
        {/*  Cicla sugli eventi e crea un Marker per ognuno */}
        {events &&
          events.map((event) => {
            // Controlla che le coordinate esistano prima di renderizzare il Marker
            const lat = event.location?.coordinates?.lat;
            const lng = event.location?.coordinates?.lng;

            if (lat && lng) {
              return (
                <MarkerF
                  key={event._id}
                  position={{ lat, lng }}
                  title={event.title}
                />
              );
            }
            return null; // Non renderizzare nulla se non ci sono coordinate
          })}
      </GoogleMap>
    </LoadScript>
  );
};

export default InteractiveMap;
