import React, { useState, useEffect } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Star, Heart, Euro } from "lucide-react";
import { formatDate, formatTime } from "../../utils/dateUtils";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import toast from "react-hot-toast";

const EventCard = ({ event: fromServerEvent, showFavoriteButton = true }) => {
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const event = {
    ...fromServerEvent,
    id: fromServerEvent._id || fromServerEvent.id,
    date: fromServerEvent.dateTime || fromServerEvent.date,
    venue: fromServerEvent.location?.venue || fromServerEvent.venue,
    city: fromServerEvent.location?.city || fromServerEvent.city,
    address: fromServerEvent.location?.address || fromServerEvent.address,
    attendees:
      fromServerEvent.currentParticipants || fromServerEvent.attendees || 0,
    capacity: fromServerEvent.maxParticipants || fromServerEvent.capacity,
    genre: fromServerEvent.danceStyle || fromServerEvent.genre,
    type: fromServerEvent.eventType || fromServerEvent.type,
  };

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (isAuthenticated) {
        try {
          const favorite = await apiService.favorites.check(event.id);
          setIsFavorite(favorite);
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      }
    };

    checkFavoriteStatus();
  }, [event.id, isAuthenticated]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Devi essere autenticato per aggiungere ai preferiti");
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await apiService.favorites.remove(event.id);
        setIsFavorite(false);
        toast.success("Evento rimosso dai preferiti");
      } else {
        await apiService.favorites.add(event.id);
        setIsFavorite(true);
        toast.success("Evento aggiunto ai preferiti");
      }
    } catch (_error) {
      console.error(_error);
      toast.error("Errore durante l'operazione");
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString) => {
    return formatDate(dateString, "short");
  };

  const formatEventTime = (dateString) => {
    return formatTime(dateString);
  };

  const getGenreBadgeClass = (genre) => {
    switch (genre) {
      case "salsa":
        return "badge-salsa";
      case "bachata":
        return "badge-bachata";
      case "misto":
        return "badge-mixed";
      default:
        return "badge-salsa";
    }
  };

  const getTypeDisplay = (type) => {
    switch (type) {
      case "serata":
        return "🌙 Serata";
      case "workshop":
        return "🎓 Workshop";
      case "congresso":
        return "🏆 Congresso";
      default:
        return type;
    }
  };

  return (
    <Card className="card-custom h-100 position-relative">
      {/* Favorite button */}
      {showFavoriteButton && isAuthenticated && (
        <Button
          variant="link"
          className="position-absolute top-0 end-0 m-0 mt-0 p-2 bg-white rounded-circle shadow-sm"
          style={{ zIndex: 10 }}
          onClick={toggleFavorite}
          disabled={loading}
        >
          <Heart
            size={18}
            className={isFavorite ? "text-danger" : "text-muted"}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </Button>
      )}

      {/* Event image */}
      <div className="position-relative overflow-hidden">
        <Card.Img
          variant="top"
          src={event.image}
          alt={event.title}
          style={{ height: "200px", objectFit: "cover" }}
        />

        {/* Genre badge */}
        <Badge
          className={`badge-custom ${getGenreBadgeClass(
            event.genre
          )} position-absolute top-0 start-0 m-2`}
        >
          {event?.genre?.charAt(0).toUpperCase() + event?.genre?.slice(1)}
        </Badge>

        {/* Price badge */}
        {event.price === 0 ? (
          <Badge bg="success" className="position-absolute bottom-0 end-0 m-2">
            Gratuito
          </Badge>
        ) : (
          <Badge bg="primary" className="position-absolute bottom-0 end-0 m-2">
            <Euro size={12} className="me-1" />
            {event.price}
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        {/* Event type */}
        <div className="mb-2">
          <small className="text-muted">{getTypeDisplay(event.type)}</small>
        </div>

        {/* Event title */}
        <Card.Title className="h5 mb-3 line-clamp-2">{event.title}</Card.Title>

        {/* Event details */}
        <div className="mb-3">
          <div className="d-flex align-items-center mb-2 text-muted small">
            <Calendar size={14} className="me-2" />
            <span>
              {formatEventDate(event.date)} alle {formatEventTime(event.date)}
            </span>
          </div>

          <div className="d-flex align-items-center mb-2 text-muted small">
            <MapPin size={14} className="me-2" />
            <span className="line-clamp-1">
              {event.venue}, {event.city}
            </span>
          </div>

          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center text-muted small">
              <Users size={14} className="me-2" />
              <span>
                {event.attendees}/{event.capacity}
              </span>
            </div>

            {event.rating > 0 && (
              <div className="d-flex align-items-center text-warning small">
                <Star size={14} className="me-1" fill="currentColor" />
                <span>{event.rating}</span>
                <span className="text-muted ms-1">({event.reviews})</span>
              </div>
            )}
          </div>
        </div>

        {/* Event description */}
        <Card.Text className="text-muted small mb-3 line-clamp-2">
          {event.description}
        </Card.Text>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="mb-3">
            {event.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                bg="light"
                text="dark"
                className="me-1 mb-1 small"
              >
                #{tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge bg="light" text="muted" className="small">
                +{event.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Organizer info */}
        <div className="d-flex align-items-center mb-3 mt-auto">
          <img
            src={event.organizer.avatar}
            alt={event.organizer.name}
            className="rounded-circle me-2"
            style={{ width: "24px", height: "24px", objectFit: "cover" }}
          />
          <small className="text-muted">
            Organizzato da <strong>{event.organizer.name}</strong>
          </small>
        </div>

        {/* Action button */}
        <Button
          as={Link}
          to={`/events/${event.id}`}
          className="btn-primary-custom w-100"
        >
          Scopri di Più
        </Button>
      </Card.Body>
    </Card>
  );
};

export default EventCard;
