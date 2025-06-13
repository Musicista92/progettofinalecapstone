import React from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Calendar, Eye, MapPin } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

const ProfileEventRow = ({ event }) => {
  if (!event) {
    return null;
  }

  return (
    <Card className="mb-3 border card-custom">
      <Card.Body>
        <Row className="align-items-center g-3">
          <Col md={3}>
            <img
              src={event.image}
              alt={event.title}
              className="img-fluid rounded"
              style={{ height: "100px", width: "100%", objectFit: "cover" }}
            />
          </Col>
          <Col md={6}>
            <h6 className="fw-bold mb-1">{event.title}</h6>
            <p className="text-muted small mb-2">
              {event.description?.substring(0, 100)}...
            </p>
            <div className="small text-muted d-flex align-items-center">
              <Calendar size={14} className="me-2" />
              <span>{formatDate(event.dateTime, "full")}</span>
              <MapPin size={14} className="ms-3 me-2" />
              <span>{event.location?.city || "N/D"}</span>
            </div>
          </Col>
          <Col md={3} className="text-md-end">
            <Button
              as={Link}
              to={`/events/${event._id}`}
              variant="outline-primary"
              size="sm"
            >
              <Eye size={14} className="me-1" />
              Vedi Evento
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ProfileEventRow;
