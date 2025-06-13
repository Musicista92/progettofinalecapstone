import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Music, Heart, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-custom">
      <Container>
        <Row>
          <Col md={4} className="mb-4">
            <div className="d-flex align-items-center mb-3">
              <Music size={24} className="me-2" />
              <h5 className="mb-0">RitmoCaribe</h5>
            </div>
            <p className="text-light opacity-75">
              La piattaforma di riferimento per gli eventi di danza caraibica in
              Campania. Unisciti alla nostra comunità e vivi la passione del
              ritmo!
            </p>
            <div className="d-flex align-items-center text-light opacity-75">
              <Heart size={16} className="me-2 text-danger" />
              <small>Fatto con passione per la danza</small>
            </div>
          </Col>

          <Col md={4} className="mb-4">
            <h6 className="mb-3">Link Utili</h6>
            <div className="d-flex flex-column">
              <a
                href="/events"
                className="text-light opacity-75 text-decoration-none mb-2"
              >
                📅 Eventi
              </a>
              <a
                href="/my-ritmo"
                className="text-light opacity-75 text-decoration-none mb-2"
              >
                ❤️ I Miei Preferiti
              </a>
              <a
                href="/create-event"
                className="text-light opacity-75 text-decoration-none mb-2"
              >
                ➕ Crea Evento
              </a>
              <a
                href="#privacy"
                className="text-light opacity-75 text-decoration-none mb-2"
              >
                🔒 Privacy Policy
              </a>
              <a
                href="#terms"
                className="text-light opacity-75 text-decoration-none"
              >
                📋 Termini di Servizio
              </a>
            </div>
          </Col>

          <Col md={4} className="mb-4">
            <h6 className="mb-3">Contatti</h6>
            <div className="d-flex flex-column">
              <div className="d-flex align-items-center mb-2 text-light opacity-75">
                <Mail size={16} className="me-2" />
                <span>info@ritmocaribe.com</span>
              </div>
              <div className="d-flex align-items-center mb-2 text-light opacity-75">
                <Phone size={16} className="me-2" />
                <span>+39 081 123 4567</span>
              </div>
              <div className="d-flex align-items-center text-light opacity-75">
                <MapPin size={16} className="me-2" />
                <span>Napoli, Campania</span>
              </div>
            </div>

            <div className="mt-3">
              <h6 className="mb-2">Seguici</h6>
              <div className="d-flex gap-2">
                <a
                  href="#facebook"
                  className="text-light opacity-75 text-decoration-none"
                  style={{ fontSize: "1.2rem" }}
                >
                  📘
                </a>
                <a
                  href="#instagram"
                  className="text-light opacity-75 text-decoration-none"
                  style={{ fontSize: "1.2rem" }}
                >
                  📸
                </a>
                <a
                  href="#youtube"
                  className="text-light opacity-75 text-decoration-none"
                  style={{ fontSize: "1.2rem" }}
                >
                  📺
                </a>
                <a
                  href="#tiktok"
                  className="text-light opacity-75 text-decoration-none"
                  style={{ fontSize: "1.2rem" }}
                >
                  🎵
                </a>
              </div>
            </div>
          </Col>
        </Row>

        <hr className="border-light opacity-25 my-4" />

        <Row className="align-items-center">
          <Col md={6}>
            <p className="mb-0 text-light opacity-75">
              © {currentYear} RitmoCaribe. Tutti i diritti riservati.
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <small className="text-light opacity-50">
              Versione 1.0.0 • Sviluppato con React & Bootstrap
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
