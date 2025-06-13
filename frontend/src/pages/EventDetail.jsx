import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Alert,
  ProgressBar,
  Spinner,
} from "react-bootstrap";
import {
  Calendar,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  Clock,
  Euro,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SocialSharing from "../components/common/SocialSharing";
import CalendarExport from "../components/common/CalendarExport";
import InteractiveMap from "../components/common/InteractiveMap";
import CommentsSection from "../components/events/CommentsSection";
import FollowButton from "../components/user/FollowButton";
import {
  formatDate,
  formatTime,
  getEventStatus,
  getDuration,
} from "../utils/dateUtils";
import toast from "react-hot-toast";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const eventData = await apiService.events.getById(id);
      setEvent(eventData);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Evento non trovato o non più disponibile.");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEventDetail();
    }
  }, [id]);

  useEffect(() => {
    if (event && user) {
      // Controlla partecipazione
      const userIsParticipant = (event?.participants || []).some(
        (p) => (p.user?._id || p.user) === user._id
      );
      setIsParticipant(userIsParticipant);

      // Controlla favoriti (separato dalla partecipazione)
      setIsFavorite(event.isFavourite || false);
    } else {
      setIsParticipant(false);
      setIsFavorite(false);
    }
  }, [event, user]);

  const handleToggleParticipation = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Devi essere autenticato per questa azione.");
      navigate("/login");
      return;
    }

    if (!event?._id) {
      toast.error("Errore: evento non valido.");
      return;
    }

    setActionLoading(true);
    const eventId = event._id;
    const originalEvent = { ...event }; // Copia completa per il rollback

    try {
      // Ottimismo UI: aggiorna lo stato prima della chiamata API
      const wasParticipant = isParticipant;
      const newParticipantCount = wasParticipant
        ? Math.max(0, (event.currentParticipants || 0) - 1)
        : (event.currentParticipants || 0) + 1;

      const newParticipants = wasParticipant
        ? (event.participants || []).filter(
            (p) => (p.user?._id || p.user) !== user._id
          )
        : [
            ...(event.participants || []),
            { user: user, registeredAt: new Date(), status: "registered" },
          ];

      const updatedEventOptimistic = {
        ...event,
        currentParticipants: newParticipantCount,
        participants: newParticipants,
      };

      setEvent(updatedEventOptimistic);
      setIsParticipant(!wasParticipant);

      // Chiamata API
      const updatedEvent = await apiService.events.toggleParticipation(eventId);

      // Sincronizza con la risposta reale del server
      if (updatedEvent && typeof updatedEvent === "object") {
        setEvent(updatedEvent);

        // Ricalcola lo stato basato sui dati del server
        const serverIsParticipant = (updatedEvent?.participants || []).some(
          (p) => (p.user?._id || p.user) === user._id
        );
        setIsParticipant(serverIsParticipant);
        setIsFavorite(updatedEvent.isFavourite || false);
      }

      toast.success(
        !wasParticipant
          ? "Partecipazione confermata!"
          : "Partecipazione annullata."
      );
    } catch (error) {
      console.error("Error toggling participation:", error);
      toast.error(error.message || "Errore durante l'operazione.");

      // Rollback completo in caso di errore
      setEvent(originalEvent);
      const originalIsParticipant = (originalEvent?.participants || []).some(
        (p) => (p.user?._id || p.user) === user._id
      );
      setIsParticipant(originalIsParticipant);
      setIsFavorite(originalEvent.isFavourite || false);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler per gestire i favoriti
  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Devi essere autenticato per questa azione.");
      navigate("/login");
      return;
    }

    if (!event?._id) {
      toast.error("Errore: evento non valido.");
      return;
    }

    setFavoriteLoading(true);
    const originalFavoriteState = isFavorite;

    try {
      // Ottimismo UI
      setIsFavorite(!originalFavoriteState);

      // Chiamata API
      const result = await apiService.favorites.toggle(event._id);

      // Sincronizza con il server
      setIsFavorite(result.isFavourite);

      // Aggiorna anche l'evento se necessario
      if (event.isFavourite !== result.isFavourite) {
        setEvent((prev) => ({
          ...prev,
          isFavourite: result.isFavourite,
        }));
      }

      toast.success(
        result.isFavourite
          ? "Evento aggiunto ai preferiti!"
          : "Evento rimosso dai preferiti"
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(error.message || "Errore durante l'operazione.");

      // Rollback
      setIsFavorite(originalFavoriteState);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const getDanceStyleBadgeClass = (danceStyle) => {
    switch (danceStyle) {
      case "salsa":
        return "badge-salsa";
      case "bachata":
        return "badge-bachata";
      case "kizomba":
        return "badge-kizomba";
      default:
        return "badge-mixed";
    }
  };

  const getEventTypeDisplay = (eventType) => {
    switch (eventType) {
      case "social":
        return "🌙 Serata Social";
      case "workshop":
        return "🎓 Workshop";
      case "festival":
        return "🏆 Festival";
      case "competizione":
        return "🏅 Competizione";
      case "corso":
        return "📚 Corso";
      default:
        return eventType;
    }
  };

  if (loading) {
    return <LoadingSpinner text="Caricamento evento..." />;
  }

  if (!event) {
    return (
      <Container className="py-5 text-center">
        <h2>Evento non trovato</h2>
        <p className="text-muted">
          L'evento che stai cercando non esiste o è stato rimosso.
        </p>
        <Button as={Link} to="/events" className="btn-primary-custom">
          Torna agli Eventi
        </Button>
      </Container>
    );
  }

  const eventStatus = getEventStatus(event.dateTime, event.endDateTime);
  const isSoldOut =
    (event.currentParticipants || 0) >= (event.maxParticipants || 0);

  return (
    <>
      <Container className="py-4">
        <nav className="mb-4">
          <Button
            as={Link}
            to="/events"
            variant="link"
            className="p-0 text-decoration-none"
          >
            <ArrowLeft size={16} className="me-2" />
            Torna agli Eventi
          </Button>
        </nav>

        <Row>
          <Col lg={8}>
            <Card className="card-custom mb-4">
              <div className="position-relative">
                <Card.Img
                  variant="top"
                  src={event.image}
                  alt={event.title}
                  style={{ height: "400px", objectFit: "cover" }}
                />
                <Badge
                  className={`badge-custom ${getDanceStyleBadgeClass(
                    event.danceStyle
                  )} position-absolute top-0 start-0 m-3`}
                >
                  {event.danceStyle?.charAt(0).toUpperCase() +
                    event.danceStyle?.slice(1)}
                </Badge>
                {isAuthenticated && (
                  <Button
                    variant="danger"
                    className="position-absolute top-0 end-0 m-1 mt-0 rounded-circle p-2"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    aria-label={
                      isFavorite
                        ? "Rimuovi dai preferiti"
                        : "Aggiungi ai preferiti"
                    }
                  >
                    {favoriteLoading ? (
                      <Spinner as="span" animation="border" size="sm" />
                    ) : (
                      <Heart
                        size={20}
                        fill={isFavorite ? "white" : "none"}
                        color="white"
                      />
                    )}
                  </Button>
                )}
              </div>
            </Card>

            <Card className="card-custom mb-4">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <small className="text-muted">
                    {getEventTypeDisplay(event.eventType)}
                  </small>
                  <h1 className="display-6 fw-bold mb-0">{event.title}</h1>
                </div>

                <Row className="mb-4">
                  <Col md={6}>
                    <div className="d-flex align-items-center mb-2">
                      <Calendar size={18} className="me-3 text-primary" />
                      <div>
                        <div className="fw-semibold">
                          {formatDate(event.dateTime, "full")}
                        </div>
                        <small className="text-muted">
                          {formatTime(event.dateTime)}
                          {event.endDateTime &&
                            ` - ${formatTime(event.endDateTime)}`}
                          {event.endDateTime && (
                            <span className="ms-2">
                              ({getDuration(event.dateTime, event.endDateTime)})
                            </span>
                          )}
                        </small>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="d-flex align-items-center mb-2">
                      <MapPin size={18} className="me-3 text-primary" />
                      <div>
                        <div className="fw-semibold">
                          {event.location?.venue}
                        </div>
                        <small className="text-muted">
                          {event.location?.address}
                        </small>
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="mb-4">
                  <h5 className="mb-3">Descrizione</h5>
                  <p className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
                    {event.description}
                  </p>
                </div>

                {event.tags && event.tags.length > 0 && (
                  <div className="mb-4">
                    <h6 className="mb-2">Tags</h6>
                    <div>
                      {event.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          bg="light"
                          text="dark"
                          className="me-2 mb-1"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="d-flex align-items-center p-3 bg-light rounded">
                  <img
                    src={event.organizer?.avatar}
                    alt={event.organizer?.name}
                    className="rounded-circle me-3"
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "cover",
                    }}
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-1">Organizzato da</h6>
                    <div className="fw-semibold">{event.organizer?.name}</div>
                  </div>
                  {event.organizer && (
                    <FollowButton targetUser={event.organizer} />
                  )}
                </div>
              </Card.Body>
            </Card>
            <CommentsSection event={event} onEventUpdate={fetchEventDetail} />
          </Col>

          <Col lg={4}>
            <div className="event-detail-sidebar sticky-cards-container">
              <Card
                className="card-custom mb-4 sticky-top"
                style={{ top: "20px" }}
              >
                <Card.Body className="p-4">
                  <div className="text-center mb-3">
                    {(event.price || 0) === 0 ? (
                      <h2 className="text-success fw-bold">Gratuito</h2>
                    ) : (
                      <h2 className="text-primary fw-bold">
                        <Euro size={24} className="me-1" />
                        {(event.price || 0).toFixed(2)}
                      </h2>
                    )}
                  </div>

                  <div className="text-center text-muted mb-2">
                    <Users size={16} className="me-2" />
                    {event.currentParticipants || 0}/
                    {event.maxParticipants || 0} partecipanti
                  </div>
                  <ProgressBar
                    now={
                      event.maxParticipants
                        ? ((event.currentParticipants || 0) /
                            event.maxParticipants) *
                          100
                        : 0
                    }
                    style={{ height: "8px" }}
                    className="mb-4"
                  />

                  <div className="d-grid gap-2">
                    {eventStatus === "upcoming" && (
                      <Button
                        className="btn-primary-custom"
                        size="lg"
                        disabled={isSoldOut || actionLoading}
                        onClick={handleToggleParticipation}
                      >
                        {actionLoading ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : isSoldOut ? (
                          "Sold Out"
                        ) : isParticipant ? (
                          "Annulla Partecipazione"
                        ) : (
                          "Partecipa"
                        )}
                      </Button>
                    )}

                    {isAuthenticated && eventStatus === "upcoming" && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-secondary text-decoration-none p-0"
                        onClick={handleToggleFavorite}
                        disabled={favoriteLoading}
                      >
                        {favoriteLoading ? (
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-1"
                          />
                        ) : (
                          <Heart
                            size={14}
                            className="me-1"
                            fill={isFavorite ? "currentColor" : "none"}
                          />
                        )}
                        {isFavorite
                          ? "Rimuovi dai preferiti"
                          : "Aggiungi ai preferiti"}
                      </Button>
                    )}
                  </div>

                  <div className="social-sharing-section mt-3">
                    <Row className="g-2">
                      <Col xs={6}>
                        <SocialSharing
                          event={event}
                          hashtags={[
                            "RitmoEvents",
                            event.danceStyle,
                            event.location?.city,
                          ]}
                        />
                      </Col>
                      <Col xs={6}>
                        <CalendarExport event={event} />
                      </Col>
                    </Row>
                  </div>

                  {eventStatus === "ended" && (
                    <Alert
                      variant="secondary"
                      className="mt-3 mb-0 text-center"
                    >
                      <Clock size={16} className="me-2" />
                      Questo evento è già terminato
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              <Card
                className="card-custom mb-4 sticky-top event-info-card"
                style={{ top: "440px" }}
              >
                <Card.Header>
                  <h6 className="mb-0">Informazioni Dettagliate</h6>
                </Card.Header>
                <Card.Body>
                  {(event.averageRating || 0) > 0 && (
                    <div className="mb-3">
                      <small className="text-muted d-block">
                        Valutazione Media
                      </small>
                      <div className="d-flex align-items-center">
                        <Star
                          size={16}
                          className="text-warning me-1"
                          fill="currentColor"
                        />
                        <span className="fw-semibold">
                          {(event.averageRating || 0).toFixed(1)}
                        </span>
                        <span className="text-muted ms-1">
                          ({event.ratingCount || 0}{" "}
                          {(event.ratingCount || 0) === 1
                            ? "recensione"
                            : "recensioni"}
                          )
                        </span>
                      </div>
                    </div>
                  )}
                  {event.requirements && (
                    <div className="mb-3">
                      <small className="text-muted d-block">Requisiti</small>
                      <div>{event.requirements}</div>
                    </div>
                  )}

                  <div className="event-detail-map-section">
                    <div className="mt-5">
                      <InteractiveMap
                        events={[event]}
                        center={{
                          lat: event.location?.coordinates?.lat || 40.8518,
                          lng: event.location?.coordinates?.lng || 14.2681,
                        }}
                        zoom={15}
                        height="200px"
                      />
                    </div>

                    <div className="d-flex gap-2 mt-5">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="w-100"
                        onClick={() =>
                          alert(
                            "Logica per trovare la posizione dell'utente..."
                          )
                        }
                      >
                        <MapPin size={14} className="me-2" />
                        Trova la mia posizione
                      </Button>

                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          (event.location?.address || "") +
                            ", " +
                            (event.location?.city || "")
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={14} className="me-2" />
                        Apri in Google Maps
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default EventDetail;
