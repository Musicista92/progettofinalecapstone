import React from "react";
import { Container, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Home, Shield, ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Forbidden = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Container className="error-page">
      <div className="text-center">
        <h1 className="display-1 fw-bold" style={{ color: "#e74c3c" }}>
          403
        </h1>
        <h2>Accesso Negato</h2>
        <p className="lead">
          Non hai i permessi necessari per accedere a questa pagina.
        </p>

        {isAuthenticated ? (
          <Alert
            variant="warning"
            className="mx-auto"
            style={{ maxWidth: "600px" }}
          >
            <Shield className="me-2" size={20} />
            <strong>Ciao {user?.name}!</strong> La pagina che stai cercando di
            raggiungere richiede permessi speciali che il tuo account non
            possiede attualmente.
          </Alert>
        ) : (
          <Alert
            variant="info"
            className="mx-auto"
            style={{ maxWidth: "600px" }}
          >
            <strong>Accesso richiesto:</strong> Devi prima effettuare il login
            per accedere a questa sezione.
          </Alert>
        )}

        <div className="d-flex flex-column flex-md-row gap-3 justify-content-center mb-5">
          <Button as={Link} to="/" className="btn-primary-custom" size="lg">
            <Home className="me-2" size={20} />
            Torna alla Home
          </Button>

          {!isAuthenticated && (
            <Button as={Link} to="/login" variant="outline-primary" size="lg">
              🔐 Accedi
            </Button>
          )}

          <Button
            variant="outline-secondary"
            size="lg"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="me-2" size={20} />
            Indietro
          </Button>
        </div>

        {/* Permission Info */}
        <div className="row justify-content-center">
          <div className="col-md-10">
            <div className="card border-0 bg-light">
              <div className="card-body p-4">
                <h6 className="card-title mb-3">
                  🔐 Informazioni sui Permessi
                </h6>
                <div className="row text-start">
                  <div className="col-md-4 mb-3">
                    <div className="text-center p-3 bg-white rounded">
                      <div className="mb-2">🕺</div>
                      <h6>Utente Base</h6>
                      <small className="text-muted">
                        • Visualizza eventi
                        <br />
                        • Salva preferiti
                        <br />• Commenta eventi
                      </small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-center p-3 bg-white rounded">
                      <div className="mb-2">🎵</div>
                      <h6>Organizzatore</h6>
                      <small className="text-muted">
                        • Tutte le funzioni utente
                        <br />
                        • Crea eventi
                        <br />• Gestisce propri eventi
                      </small>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-center p-3 bg-white rounded">
                      <div className="mb-2">👑</div>
                      <h6>Amministratore</h6>
                      <small className="text-muted">
                        • Tutte le funzioni
                        <br />
                        • Approva eventi
                        <br />• Gestisce utenti
                      </small>
                    </div>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="mb-3">
                    <strong>Vuoi diventare organizzatore?</strong>
                  </p>
                  <p className="text-muted">
                    Se sei un insegnante di danza, DJ o organizzi eventi,
                    contattaci per richiedere i permessi di organizzatore.
                  </p>
                  <Button
                    variant="outline-primary"
                    href="mailto:info@ritmocaribe.com?subject=Richiesta Permessi Organizzatore"
                  >
                    <Mail className="me-2" size={16} />
                    Richiedi Permessi
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Forbidden;
