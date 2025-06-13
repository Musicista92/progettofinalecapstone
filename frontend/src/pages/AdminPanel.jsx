import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Tab,
  Tabs,
  Badge,
  Table,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import {
  Shield,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Clock,
  BarChart3,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatDate } from "../utils/dateUtils";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AdminUserModal from "../components/admin/AdminUserModal";

const AdminPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Funzioni per gestire la modale
  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsData, pendingData, eventsData, usersData] = await Promise.all(
        [
          apiService.stats.getDashboard(),
          apiService.admin.getPendingEvents(),
          apiService.events.getAll(),
          apiService.users.getUsers(),
        ]
      );

      setStats(statsData);
      setPendingEvents(pendingData || []);
      setAllEvents(eventsData.data || []);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Errore nel caricamento dei dati del pannello");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveEvent = async (eventId) => {
    try {
      await apiService.admin.approveEvent(eventId);
      setPendingEvents((prev) => prev.filter((event) => event._id !== eventId));
      toast.success("Evento approvato con successo");
      apiService.stats.getDashboard().then(setStats);
    } catch (error) {
      console.error("Error approving event:", error);
      toast.error("Errore durante l'approvazione");
    }
  };

  const handleRejectEvent = async () => {
    if (!selectedEvent) return;
    const eventId = selectedEvent._id;

    try {
      await apiService.admin.rejectEvent(eventId, rejectionReason);
      setPendingEvents((prev) => prev.filter((event) => event._id !== eventId));
      setShowApprovalModal(false);
      setSelectedEvent(null);
      setRejectionReason("");
      toast.success("Evento rifiutato");
      apiService.stats.getDashboard().then(setStats);
    } catch (error) {
      console.error("Error rejecting event:", error);
      toast.error("Errore durante il rifiuto");
    }
  };

  const openRejectModal = (event) => {
    setSelectedEvent(event);
    setShowApprovalModal(true);
  };

  if (loading) {
    return <LoadingSpinner text="Caricamento pannello admin..." />;
  }

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-3">
          <Shield className="me-3" size={48} />
          Pannello Amministratore
        </h1>
        <p className="lead text-muted">
          Benvenuto, {user?.name}! Gestisci la piattaforma RitmoCaribe
        </p>
      </div>

      <Row className="mb-5">
        <Col md={3} sm={6} className="mb-3">
          <Card className="card-custom text-center h-100 border-primary">
            <Card.Body>
              <Calendar size={32} className="text-primary mb-2" />
              <h4 className="fw-bold">{stats.totalEvents || 0}</h4>
              <small className="text-muted">Eventi Totali</small>
              {stats.pendingApprovals > 0 && (
                <Badge bg="warning" className="mt-2">
                  {stats.pendingApprovals} in attesa
                </Badge>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="card-custom text-center h-100 border-success">
            <Card.Body>
              <Users size={32} className="text-success mb-2" />
              <h4 className="fw-bold">{stats.totalUsers || 0}</h4>
              <small className="text-muted">Utenti Registrati</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="card-custom text-center h-100 border-info">
            <Card.Body>
              <TrendingUp size={32} className="text-info mb-2" />
              <h4 className="fw-bold">{stats.totalAttendees || 0}</h4>
              <small className="text-muted">Partecipazioni</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="card-custom text-center h-100 border-warning">
            <Card.Body>
              <BarChart3 size={32} className="text-warning mb-2" />
              <h4 className="fw-bold">{stats.avgRating || "N/A"}</h4>
              <small className="text-muted">Rating Medio</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="card-custom">
        <Card.Header className="bg-white">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="border-0"
          >
            <Tab
              eventKey="overview"
              title={
                <span>
                  <BarChart3 size={16} className="me-2" /> Panoramica
                </span>
              }
            />
            <Tab
              eventKey="pending"
              title={
                <span>
                  <Clock size={16} className="me-2" /> Eventi in Attesa
                  {pendingEvents.length > 0 && (
                    <Badge bg="warning" className="ms-2">
                      {pendingEvents.length}
                    </Badge>
                  )}
                </span>
              }
            />
            <Tab
              eventKey="events"
              title={
                <span>
                  <Calendar size={16} className="me-2" /> Tutti gli Eventi
                </span>
              }
            />
            <Tab
              eventKey="users"
              title={
                <span>
                  <Users size={16} className="me-2" /> Gestione Utenti
                </span>
              }
            />
          </Tabs>
        </Card.Header>

        <Card.Body className="p-4">
          {activeTab === "pending" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Eventi in Attesa di Approvazione</h5>
                <Badge bg="warning">{pendingEvents.length} eventi</Badge>
              </div>
              {pendingEvents.length > 0 ? (
                <div>
                  {pendingEvents.map((event) => (
                    <Card key={event._id} className="mb-4 border">
                      <Card.Body>
                        <Row className="align-items-center">
                          <Col md={2}>
                            <img
                              src={event.image}
                              alt={event.title}
                              className="img-fluid rounded"
                              style={{
                                height: "100px",
                                width: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Col>
                          <Col md={7}>
                            <h6 className="fw-bold mb-1">{event.title}</h6>
                            <p className="text-muted small mb-2">
                              {event.description.substring(0, 120)}...
                            </p>
                            <div className="small text-muted d-flex flex-wrap gap-2">
                              <span>
                                📅 {formatDate(event.dateTime, "datetime")}
                              </span>
                              <span>
                                📍 {event.location?.venue},{" "}
                                {event.location?.city}
                              </span>
                              <span>👤 {event.organizer?.name || "N/A"}</span>
                              <span>
                                💰{" "}
                                {event.price === 0
                                  ? "Gratuito"
                                  : `€${event.price}`}
                              </span>
                            </div>
                          </Col>
                          <Col md={3} className="text-end">
                            <div className="d-grid gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleApproveEvent(event._id)}
                              >
                                <CheckCircle size={14} className="me-1" />{" "}
                                Approva
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => openRejectModal(event)}
                              >
                                <XCircle size={14} className="me-1" /> Rifiuta
                              </Button>
                              <Button
                                as={Link}
                                to={`/events/${event._id}`}
                                target="_blank"
                                size="sm"
                                variant="outline-primary"
                              >
                                <Eye size={14} className="me-1" /> Dettagli
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <CheckCircle size={64} className="text-success mb-3" />
                  <h4>Nessun evento in attesa</h4>
                  <p className="text-muted">
                    Tutti gli eventi sono stati revisionati!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Gestione Utenti</h5>
                <Badge bg="info">{users.length} utenti</Badge>
              </div>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Utente</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                    <th>Registrato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr key={userData._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={userData.avatar}
                            alt={userData.name}
                            className="rounded-circle me-2"
                            style={{
                              width: "32px",
                              height: "32px",
                              objectFit: "cover",
                            }}
                          />
                          <div>
                            <div className="fw-semibold">{userData.name}</div>
                            <small className="text-muted">
                              {(userData.followers || []).length} followers
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{userData.email}</td>
                      <td>
                        <Badge
                          bg={
                            userData.role === "admin"
                              ? "danger"
                              : userData.role === "organizer"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {userData.role === "admin"
                            ? "👑 Admin"
                            : userData.role === "organizer"
                            ? "🎵 Organizer"
                            : "🕺 User"}
                        </Badge>
                      </td>
                      <td>
                        <small>{formatDate(userData.createdAt, "short")}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            as={Link}
                            to={`/users/${userData._id}`}
                            size="sm"
                            variant="outline-primary"
                            title="Vedi Profilo"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            title="Modifica Utente"
                            onClick={() => handleOpenEditModal(userData)}
                          >
                            <Edit size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <AdminUserModal
                  user={selectedUser}
                  show={showEditModal}
                  onHide={handleCloseEditModal}
                  onUserUpdate={fetchDashboardData}
                />
              </Table>
            </div>
          )}

          {/* ... altri pannelli come "overview" e "events" ... */}
          {activeTab === "overview" && (
            <div className="text-center py-5">
              <small className="text-muted">Panoramica in sviluppo...</small>
            </div>
          )}
          {activeTab === "events" && (
            <div className="text-center py-5">
              <small className="text-muted">
                Gestione eventi in sviluppo...
              </small>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showApprovalModal}
        onHide={() => setShowApprovalModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <AlertTriangle className="me-2 text-warning" size={20} /> Rifiuta
            Evento
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Attenzione:</strong> Stai per rifiutare l'evento "
            {selectedEvent?.title}". Questa azione non può essere annullata.
          </Alert>
          <Form.Group>
            <Form.Label>Motivo del rifiuto (opzionale)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Spiega perché l'evento non può essere approvato..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowApprovalModal(false)}
          >
            Annulla
          </Button>
          <Button variant="danger" onClick={handleRejectEvent}>
            <XCircle size={16} className="me-2" /> Rifiuta Evento
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPanel;
