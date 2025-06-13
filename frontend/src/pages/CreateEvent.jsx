import React, { useState } from "react";
import { Container, Card, Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { PlusCircle, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import EventForm from "../components/events/EventForm";
import toast from "react-hot-toast";

const CreateEvent = () => {
  const { user, isOrganizer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Check if user has permission to create events
  if (!user || (!isOrganizer && !isAdmin)) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <h5>Accesso Negato</h5>
          <p>Solo gli organizzatori autorizzati possono proporre eventi.</p>
          <Button variant="primary" onClick={() => navigate("/events")}>
            Torna agli Eventi
          </Button>
        </Alert>
      </Container>
    );
  }

  const handleCreateEvent = async (eventFormData) => {
    setLoading(true);
    try {
      const newEvent = await apiService.events.create(eventFormData);

      setSubmitSuccess(true);
      toast.success("Evento creato con successo! In attesa di approvazione.");

      // Redirect after a short delay
      setTimeout(() => {
        if (isAdmin) {
          navigate(`/admin/events/${newEvent._id}`);
        } else {
          navigate("/my-ritmo");
        }
      }, 2000);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error(
        error.response?.data?.message ||
          "Errore durante la creazione dell'evento"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (submitSuccess) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="mb-4">
            <CheckCircle size={64} className="text-success" />
          </div>
          <h2 className="text-success mb-3">Evento Creato con Successo!</h2>
          <p className="lead text-muted mb-4">
            Il tuo evento è stato inviato e verrà revisionato dal nostro team.
          </p>
          <Alert
            variant="info"
            className="mx-auto"
            style={{ maxWidth: "600px" }}
          >
            <Clock className="me-2" size={20} />
            <strong>Prossimi passi:</strong>
            <ul className="mb-0 mt-2 text-start">
              <li>Il nostro team revisionerà l'evento entro 24 ore</li>
              <li>Riceverai una notifica quando sarà approvato</li>
              <li>Una volta approvato, sarà visibile a tutti gli utenti</li>
              <li>Potrai modificarlo dalla tua area personale</li>
            </ul>
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-3">
          <PlusCircle className="me-3" size={48} />
          Crea Nuovo Evento
        </h1>
        <p className="lead text-muted">
          Condividi la tua passione per la danza caraibica con la community
        </p>
      </div>

      {/* Organizer Info Alert */}
      <Alert variant="info" className="mb-4">
        <div className="d-flex align-items-start">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="rounded-circle me-3"
            style={{ width: "48px", height: "48px", objectFit: "cover" }}
          />
          <div>
            <h6 className="mb-1">Stai creando come: {user?.name}</h6>
            <small className="text-muted">
              {isAdmin ? "👑 Admin" : "🎵 Organizzatore"} •
              {isAdmin
                ? " Evento sarà pubblicato immediatamente"
                : " Evento richiederà approvazione"}
            </small>
          </div>
        </div>
      </Alert>

      {/* Event Creation Form */}
      <Card className="card-custom">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Dettagli Evento</h5>
        </Card.Header>
        <Card.Body className="p-4">
          <EventForm
            onSubmit={handleCreateEvent}
            onCancel={handleCancel}
            loading={loading}
            submitText="Crea Evento"
          />
        </Card.Body>
      </Card>

      {/* Tips for Organizers */}
      <Card className="card-custom mt-4">
        <Card.Body className="text-center py-4">
          <h6 className="mb-3">💡 Suggerimenti per un Evento di Successo</h6>
          <div className="row text-start">
            <div className="col-md-6">
              <div className="mb-3">
                <strong>📝 Descrizione Dettagliata</strong>
                <p className="text-muted small mb-0">
                  Spiega cosa succederà durante l'evento, chi può partecipare e
                  cosa portare
                </p>
              </div>
              <div className="mb-3">
                <strong>🎵 Specifica il Livello</strong>
                <p className="text-muted small mb-0">
                  Indica chiaramente se è per principianti, intermedi o avanzati
                </p>
              </div>
              <div className="mb-3">
                <strong>📍 Informazioni sul Luogo</strong>
                <p className="text-muted small mb-0">
                  Fornisci indicazioni precise e informazioni sul parcheggio
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <strong>📸 Immagine Accattivante</strong>
                <p className="text-muted small mb-0">
                  Una bella locandina attira più partecipanti
                </p>
              </div>
              <div className="mb-3">
                <strong>💰 Prezzo Trasparente</strong>
                <p className="text-muted small mb-0">
                  Indica chiaramente cosa include il prezzo del biglietto
                </p>
              </div>
              <div className="mb-3">
                <strong>🏷️ Tag Appropriati</strong>
                <p className="text-muted small mb-0">
                  Usa tag che aiutino le persone a trovare il tuo evento
                </p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Process Explanation */}
      <Card className="card-custom mt-4">
        <Card.Header className="bg-light">
          <h6 className="mb-0">🔄 Processo di Approvazione</h6>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-3 text-center mb-3">
              <div className="mb-2">
                <div
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                >
                  1
                </div>
              </div>
              <h6 className="small">Creazione</h6>
              <p className="text-muted small">
                Compili il form e invii l'evento
              </p>
            </div>
            <div className="col-md-3 text-center mb-3">
              <div className="mb-2">
                <div
                  className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                >
                  2
                </div>
              </div>
              <h6 className="small">Revisione</h6>
              <p className="text-muted small">Il team controlla i dettagli</p>
            </div>
            <div className="col-md-3 text-center mb-3">
              <div className="mb-2">
                <div
                  className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                >
                  3
                </div>
              </div>
              <h6 className="small">Approvazione</h6>
              <p className="text-muted small">L'evento viene pubblicato</p>
            </div>
            <div className="col-md-3 text-center mb-3">
              <div className="mb-2">
                <div
                  className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "40px", height: "40px" }}
                >
                  4
                </div>
              </div>
              <h6 className="small">Promozione</h6>
              <p className="text-muted small">Gli utenti possono partecipare</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateEvent;
