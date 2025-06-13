import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Tab,
  Tabs,
  Button,
  Badge,
} from "react-bootstrap";
import {
  Heart,
  Calendar,
  User,
  Settings,
  Bell,
  MapPin,
  Star,
  Download,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EventCard from "../components/events/EventCard";
import InteractiveMap from "../components/common/InteractiveMap";
import CalendarExport from "../components/common/CalendarExport";
import { formatDate, getEventStatus } from "../utils/dateUtils";
import toast from "react-hot-toast";

const MyRitmo = () => {
  const { user } = useAuth();
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("favorites");
  const [stats, setStats] = useState({
    totalFavorites: 0,
    upcomingEvents: 0,
    attendedEvents: 0,
    followingCount: 0,
  });

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Ottieni eventi partecipati invece di preferiti
      const joinedEventsResponse = await apiService.events.getJoinedEvents();
      const joinedEvents = joinedEventsResponse.events || [];

      setFavoriteEvents(joinedEvents);

      // Calcola statistiche
      const upcoming = joinedEvents.filter(
        (event) =>
          getEventStatus(
            event.dateTime || event.date,
            event.endDateTime || event.endDate
          ) === "upcoming"
      ).length;

      const attended = joinedEvents.filter(
        (event) =>
          getEventStatus(
            event.dateTime || event.date,
            event.endDateTime || event.endDate
          ) === "ended"
      ).length;

      setStats({
        totalFavorites: joinedEvents.length,
        upcomingEvents: upcoming,
        attendedEvents: attended,
        followingCount: user?.following?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const handleEventRemoved = (eventId) => {
    setFavoriteEvents((prev) => prev.filter((event) => event.id !== eventId));
    setStats((prev) => ({
      ...prev,
      totalFavorites: prev.totalFavorites - 1,
    }));
  };

  const getUpcomingEvents = () => {
    return favoriteEvents.filter(
      (event) => getEventStatus(event.date, event.endDate) === "upcoming"
    );
  };

  const getPastEvents = () => {
    return favoriteEvents.filter(
      (event) => getEventStatus(event.date, event.endDate) === "ended"
    );
  };

  if (loading) {
    return <LoadingSpinner text="Caricamento MyRitmo..." />;
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="d-flex justify-content-center align-items-center mb-3">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="rounded-circle me-3"
            style={{ width: "80px", height: "80px", objectFit: "cover" }}
          />
          <div className="text-start">
            <h1 className="display-6 fw-bold mb-1">
              <Heart className="me-2 text-danger" size={32} />
              MyRitmo
            </h1>
            <p className="text-muted mb-0">Benvenuto, {user?.name}!</p>
          </div>
        </div>
        <p className="lead text-muted">
          Il tuo spazio personale per gestire eventi preferiti e scoprire nuove
          esperienze
        </p>
      </div>

      {/* Stats Cards */}
      <Row className="mb-5">
        <Col md={3} sm={6} className="mb-3">
          <Card className="card-custom text-center h-100">
            <Card.Body>
              <Heart size={32} className="text-danger mb-2" />
              <h4 className="fw-bold">{stats.totalFavorites}</h4>
              <small className="text-muted">Eventi Preferiti</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="card-custom text-center h-100">
            <Card.Body>
              <Calendar size={32} className="text-primary mb-2" />
              <h4 className="fw-bold">{stats.upcomingEvents}</h4>
              <small className="text-muted">Prossimi Eventi</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="card-custom text-center h-100">
            <Card.Body>
              <Star size={32} className="text-warning mb-2" />
              <h4 className="fw-bold">{stats.attendedEvents}</h4>
              <small className="text-muted">Eventi Passati</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="card-custom text-center h-100">
            <Card.Body>
              <User size={32} className="text-info mb-2" />
              <h4 className="fw-bold">{stats.followingCount}</h4>
              <small className="text-muted">Seguiti</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card className="card-custom">
        <Card.Header className="bg-white">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="border-0"
          >
            <Tab
              eventKey="favorites"
              title={
                <span>
                  <Heart size={16} className="me-2" />
                  Tutti i Preferiti
                  {stats.totalFavorites > 0 && (
                    <Badge bg="danger" className="ms-2">
                      {stats.totalFavorites}
                    </Badge>
                  )}
                </span>
              }
            />
            <Tab
              eventKey="upcoming"
              title={
                <span>
                  <Calendar size={16} className="me-2" />
                  Prossimi Eventi
                  {stats.upcomingEvents > 0 && (
                    <Badge bg="primary" className="ms-2">
                      {stats.upcomingEvents}
                    </Badge>
                  )}
                </span>
              }
            />
            <Tab
              eventKey="past"
              title={
                <span>
                  <Star size={16} className="me-2" />
                  Eventi Passati
                </span>
              }
            />
            <Tab
              eventKey="map"
              title={
                <span>
                  <MapPin size={16} className="me-2" />
                  Mappa Eventi
                </span>
              }
            />
            <Tab
              eventKey="profile"
              title={
                <span>
                  <Settings size={16} className="me-2" />
                  Profilo
                </span>
              }
            />
          </Tabs>
        </Card.Header>

        <Card.Body className="p-4">
          {/* All Favorites Tab */}
          {activeTab === "favorites" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">I Tuoi Eventi Preferiti</h5>
                <div className="d-flex gap-2">
                  <CalendarExport
                    events={favoriteEvents}
                    type="multiple"
                    variant="outline-success"
                    size="sm"
                  />
                  <Button variant="outline-primary" href="/events">
                    <Calendar size={16} className="me-2" />
                    Scopri Altri Eventi
                  </Button>
                </div>
              </div>

              {favoriteEvents.length > 0 ? (
                <Row>
                  {favoriteEvents.map((event) => (
                    <Col key={event.id} lg={4} md={6} className="mb-4">
                      <EventCard
                        event={event}
                        onEventRemoved={() => handleEventRemoved(event.id)}
                      />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <Heart size={64} className="text-muted mb-3" />
                  <h4>Nessun evento nei preferiti</h4>
                  <p className="text-muted mb-4">
                    Inizia ad esplorare gli eventi e salva quelli che ti
                    interessano!
                  </p>
                  <Button href="/events" className="btn-primary-custom">
                    Esplora Eventi
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Events Tab */}
          {activeTab === "upcoming" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Prossimi Eventi</h5>
                <Badge bg="primary">{getUpcomingEvents().length} eventi</Badge>
              </div>

              {getUpcomingEvents().length > 0 ? (
                <Row>
                  {getUpcomingEvents().map((event) => (
                    <Col key={event.id} lg={4} md={6} className="mb-4">
                      <EventCard event={event} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <Calendar size={64} className="text-muted mb-3" />
                  <h4>Nessun evento in programma</h4>
                  <p className="text-muted">
                    Non hai eventi prossimi nei tuoi preferiti.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Past Events Tab */}
          {activeTab === "past" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Eventi Passati</h5>
                <Badge bg="secondary">{getPastEvents().length} eventi</Badge>
              </div>

              {getPastEvents().length > 0 ? (
                <Row>
                  {getPastEvents().map((event) => (
                    <Col key={event.id} lg={4} md={6} className="mb-4">
                      <EventCard event={event} showFavoriteButton={false} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <Star size={64} className="text-muted mb-3" />
                  <h4>Nessun evento passato</h4>
                  <p className="text-muted">
                    I tuoi eventi passati verranno mostrati qui.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Map Tab */}
          {activeTab === "map" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Mappa dei Tuoi Eventi</h5>
                <Badge bg="info">{favoriteEvents.length} eventi</Badge>
              </div>

              {favoriteEvents.length > 0 ? (
                <InteractiveMap
                  events={favoriteEvents}
                  center={{ lat: 40.8518, lng: 14.2681 }}
                  zoom={11}
                  height="500px"
                  showEventDetails={true}
                  onEventClick={(event) =>
                    window.open(`/events/${event.id}`, "_blank")
                  }
                />
              ) : (
                <div className="text-center py-5">
                  <MapPin size={64} className="text-muted mb-3" />
                  <h4>Nessun evento da mostrare</h4>
                  <p className="text-muted">
                    Aggiungi eventi ai preferiti per vederli sulla mappa
                  </p>
                  <Button href="/events" className="btn-primary-custom">
                    Esplora Eventi
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div>
              <h5 className="mb-4">Informazioni Profilo</h5>

              <Row>
                <Col md={8}>
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <div className="d-flex align-items-start mb-3">
                        <img
                          src={user?.avatar}
                          alt={user?.name}
                          className="rounded-circle me-3"
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                          }}
                        />
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{user?.name}</h6>
                          <p className="text-muted mb-1">{user?.email}</p>
                          <Badge
                            bg={
                              user?.role === "admin"
                                ? "danger"
                                : user?.role === "organizer"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {user?.role === "admin"
                              ? "👑 Admin"
                              : user?.role === "organizer"
                              ? "🎵 Organizzatore"
                              : "🕺 Ballerino/a"}
                          </Badge>
                        </div>
                      </div>

                      {user?.bio && (
                        <div className="mb-3">
                          <h6 className="small text-muted mb-2">BIO</h6>
                          <p className="mb-0">{user.bio}</p>
                        </div>
                      )}

                      <div className="row text-center mt-4">
                        <div className="col-4">
                          <div className="fw-bold">
                            {user?.following?.length || 0}
                          </div>
                          <small className="text-muted">Seguiti</small>
                        </div>
                        <div className="col-4">
                          <div className="fw-bold">
                            {user?.followers?.length || 0}
                          </div>
                          <small className="text-muted">Followers</small>
                        </div>
                        <div className="col-4">
                          <div className="fw-bold">
                            {formatDate(user?.createdAt, "short")}
                          </div>
                          <small className="text-muted">Membro dal</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <div className="d-grid gap-2">
                    <Button variant="outline-primary">
                      <Settings size={16} className="me-2" />
                      Modifica Profilo
                    </Button>
                    <Button variant="outline-secondary">
                      <Bell size={16} className="me-2" />
                      Notifiche
                    </Button>
                    <Button variant="outline-info">
                      <MapPin size={16} className="me-2" />
                      Preferenze Località
                    </Button>
                  </div>

                  <Card className="border-0 bg-light mt-3">
                    <Card.Body className="text-center">
                      <h6 className="mb-2">🎉 Prossima Funzionalità</h6>
                      <small className="text-muted">
                        Presto potrai visualizzare una mappa interattiva con
                        tutti gli eventi vicino a te!
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MyRitmo;
