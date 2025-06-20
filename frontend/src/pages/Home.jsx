import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  Star,
  ArrowRight,
  Music,
  Heart,
  MapPin,
} from "lucide-react";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EventCard from "../components/events/EventCard";

const Home = ({ isAdmin }) => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Get featured events (upcoming events with high ratings)
        const eventsResponse = await apiService.events.getAll({
          dateFrom: new Date().toISOString(),
        });

        const featured = eventsResponse.data
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 6);

        setFeaturedEvents(featured);

        // Get stats
        if (isAdmin) {
          const statsResponse = await apiService.stats.getDashboard();
          setStats(statsResponse);
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Caricamento homepage..." />;
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <div className="hero-content fade-in-up">
            <h1>Vivi il Ritmo Caraibico</h1>
            <p className="lead">
              Scopri i migliori eventi di salsa e bachata in Campania. Unisciti
              alla nostra community di appassionati!
            </p>
            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
              <Button
                as={Link}
                to="/events"
                className="btn-primary-custom"
                size="lg"
              >
                <Calendar className="me-2" size={20} />
                Esplora Eventi
              </Button>
              <Button
                as={Link}
                to="/register"
                variant="outline-light"
                size="lg"
                className="border-2"
              >
                <Users className="me-2" size={20} />
                Unisciti a Noi
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-5 bg-light">
          <Container>
            <Row className="text-center">
              <Col md={3} sm={6} className="mb-4">
                <div className="p-4">
                  <div className="h2 text-primary mb-2">
                    {stats.totalEvents}
                  </div>
                  <div className="text-muted">Eventi Totali</div>
                </div>
              </Col>
              <Col md={3} sm={6} className="mb-4">
                <div className="p-4">
                  <div className="h2 text-primary mb-2">{stats.totalUsers}</div>
                  <div className="text-muted">Utenti Registrati</div>
                </div>
              </Col>
              <Col md={3} sm={6} className="mb-4">
                <div className="p-4">
                  <div className="h2 text-primary mb-2">
                    {stats.totalAttendees}
                  </div>
                  <div className="text-muted">Partecipanti</div>
                </div>
              </Col>
              <Col md={3} sm={6} className="mb-4">
                <div className="p-4">
                  <div className="h2 text-primary mb-2">
                    <Star className="me-1" size={24} fill="currentColor" />
                    {stats.avgRating}
                  </div>
                  <div className="text-muted">Rating Medio</div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* Featured Events */}
      <section className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Eventi in Evidenza</h2>
            <p className="lead text-muted">
              I migliori eventi di danza caraibica selezionati per te
            </p>
          </div>

          {featuredEvents.length > 0 ? (
            <>
              <Row>
                {featuredEvents.map((event, index) => (
                  <Col key={index} lg={4} md={6} className="mb-4">
                    <EventCard event={event} />
                  </Col>
                ))}
              </Row>

              <div className="text-center mt-4">
                <Button
                  as={Link}
                  to="/events"
                  className="btn-secondary-custom"
                  size="lg"
                >
                  Vedi Tutti gli Eventi
                  <ArrowRight className="ms-2" size={20} />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <Music size={64} className="text-muted mb-3" />
              <h4>Nessun evento in evidenza</h4>
              <p className="text-muted">
                Gli eventi verranno mostrati qui quando saranno disponibili.
              </p>
              <Button as={Link} to="/events" className="btn-primary-custom">
                Esplora Tutti gli Eventi
              </Button>
            </div>
          )}
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">
              Perché Scegliere RitmoCaribe?
            </h2>
            <p className="lead text-muted">
              La piattaforma completa per la community di danza caraibica
            </p>
          </div>

          <Row>
            <Col md={4} className="mb-4">
              <Card className="card-custom h-100 text-center">
                <Card.Body className="p-4">
                  <div className="mb-3">
                    <Calendar size={48} className="text-primary" />
                  </div>
                  <Card.Title>Eventi Organizzati</Card.Title>
                  <Card.Text className="text-muted">
                    Trova facilmente tutti gli eventi di salsa e bachata nella
                    tua zona. Filtra per data, tipo e livello.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="card-custom h-100 text-center">
                <Card.Body className="p-4">
                  <div className="mb-3">
                    <Heart size={48} className="text-primary" />
                  </div>
                  <Card.Title>Lista Preferiti</Card.Title>
                  <Card.Text className="text-muted">
                    Salva i tuoi eventi preferiti e ricevi promemoria
                    automatici. Non perdere mai un evento importante!
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="card-custom h-100 text-center">
                <Card.Body className="p-4">
                  <div className="mb-3">
                    <Users size={48} className="text-primary" />
                  </div>
                  <Card.Title>Community Attiva</Card.Title>
                  <Card.Text className="text-muted">
                    Connettiti con altri appassionati, segui organizzatori e
                    condividi le tue esperienze.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section
        className="py-5"
        style={{ background: "var(--gradient-secondary)" }}
      >
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h3 className="text-white mb-3">Pronto a Vivere il Ritmo?</h3>
              <p className="text-white opacity-90 mb-0">
                Registrati ora e scopri tutti gli eventi di danza caraibica
                nella tua zona. È gratuito e ci vuole meno di un minuto!
              </p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Button
                as={Link}
                to="/register"
                variant="light"
                size="lg"
                className="fw-bold"
              >
                Inizia Ora
                <ArrowRight className="ms-2" size={20} />
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;