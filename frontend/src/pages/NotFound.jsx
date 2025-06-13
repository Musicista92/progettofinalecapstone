import React from "react";
import { Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  return (
    <Container className="error-page">
      <div className="text-center">
        <h1 className="display-1 fw-bold">404</h1>
        <h2>Pagina Non Trovata</h2>
        <p className="lead">
          Ops! La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <p className="text-muted mb-4">
          Potrebbe essere stata rimossa, rinominata o è temporaneamente non
          disponibile.
        </p>

        <div className="d-flex flex-column flex-md-row gap-3 justify-content-center mb-5">
          <Button as={Link} to="/" className="btn-primary-custom" size="lg">
            <Home className="me-2" size={20} />
            Torna alla Home
          </Button>

          <Button as={Link} to="/events" variant="outline-primary" size="lg">
            <Search className="me-2" size={20} />
            Esplora Eventi
          </Button>

          <Button
            variant="outline-secondary"
            size="lg"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="me-2" size={20} />
            Indietro
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0 bg-light">
              <div className="card-body p-4">
                <h6 className="card-title mb-3">🔗 Link Utili</h6>
                <div className="row text-start">
                  <div className="col-md-6">
                    <div className="mb-2">
                      <Link to="/events" className="text-decoration-none">
                        📅 Eventi di Danza
                      </Link>
                    </div>
                    <div className="mb-2">
                      <Link to="/login" className="text-decoration-none">
                        🔐 Accedi al Tuo Account
                      </Link>
                    </div>
                    <div className="mb-2">
                      <Link to="/register" className="text-decoration-none">
                        ✨ Registrati Gratuitamente
                      </Link>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-2">
                      <a
                        href="mailto:info@ritmocaribe.com"
                        className="text-decoration-none"
                      >
                        📧 Contattaci
                      </a>
                    </div>
                    <div className="mb-2">
                      <a href="#help" className="text-decoration-none">
                        ❓ Centro Assistenza
                      </a>
                    </div>
                    <div className="mb-2">
                      <a href="#feedback" className="text-decoration-none">
                        💬 Invia Feedback
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default NotFound;
