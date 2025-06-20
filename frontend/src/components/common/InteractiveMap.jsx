import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Card } from "react-bootstrap";
import L from "leaflet";

// CSS richiesto da Leaflet
import "leaflet/dist/leaflet.css";

// FIX per un problema comune con Webpack dove le icone dei marker non appaiono.
// Questo codice importa le icone direttamente e le imposta come predefinite.
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const InteractiveMap = ({
  events = [],
  center = { lat: 40.6828, lng: 16.5959 }, // Default: Matera, IT
  zoom = 13,
  height = "300px",
}) => {
  // Trova il primo evento con coordinate valide per centrare la mappa,
  // altrimenti usa il centro di default.
  const firstEventWithCoords = events.find(
    (e) => e.location?.coordinates?.lat && e.location?.coordinates?.lng
  );
  const mapCenter = firstEventWithCoords
    ? [
      firstEventWithCoords.location.coordinates.lat,
      firstEventWithCoords.location.coordinates.lng,
    ]
    : [center.lat, center.lng];

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {events.map((event) => {
        // Renderizza il marcatore solo se l'evento ha coordinate valide
        if (
          event.location?.coordinates?.lat &&
          event.location?.coordinates?.lng
        ) {
          return (
            <Marker
              key={event._id}
              position={[
                event.location.coordinates.lat,
                event.location.coordinates.lng,
              ]}
            >
              <Popup>
                <Card border="light" style={{ width: "180px" }}>
                  <Card.Body className="p-2">
                    <Card.Title
                      as="h6"
                      className="mb-1"
                      style={{ fontSize: "0.9rem" }}
                    >
                      {event.title}
                    </Card.Title>
                    <Card.Text
                      className="text-muted"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {event.location.venue}
                    </Card.Text>
                    <a
                      href={`/events/${event._id}`}
                      className="btn btn-primary btn-sm w-100 mt-2"
                    >
                      Vedi Dettagli
                    </a>
                  </Card.Body>
                </Card>
              </Popup>
            </Marker>
          );
        }
        return null; // Non renderizzare nulla se non ci sono coordinate
      })}
    </MapContainer>
  );
};

export default InteractiveMap;