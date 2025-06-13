import React from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import { Search, MapPin, Calendar, Euro, Filter } from "lucide-react";

const EventFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
}) => {
  const handleInputChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  return (
    <Card className="card-custom mb-4">
      <Card.Header>
        <h5 className="mb-0">
          <Filter className="me-2" size={20} />
          Filtra Eventi
        </h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleFormSubmit}>
          <Row>
            {/* Search */}
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label>
                  <Search size={16} className="me-2" />
                  Cerca
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Titolo, descrizione, organizzatore..."
                  value={filters.search || ""}
                  onChange={(e) => handleInputChange("search", e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* City */}
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label>
                  <MapPin size={16} className="me-2" />
                  Città
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Es. Milano, Roma, Napoli..."
                  value={filters.city === "all" ? "" : filters.city || ""}
                  onChange={(e) =>
                    handleInputChange("city", e.target.value || "all")
                  }
                />
              </Form.Group>
            </Col>

            {/* Dance Style */}
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label>Stile di Danza</Form.Label>
                <Form.Select
                  value={filters.danceStyle || "all"}
                  onChange={(e) =>
                    handleInputChange("danceStyle", e.target.value)
                  }
                >
                  <option value="all">Tutti gli stili</option>
                  <option value="salsa">Salsa</option>
                  <option value="bachata">Bachata</option>
                  <option value="kizomba">Kizomba</option>
                  <option value="merengue">Merengue</option>
                  <option value="reggaeton">Reggaeton</option>
                  <option value="altro">Altro</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Skill Level */}
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label>Livello</Form.Label>
                <Form.Select
                  value={filters.skillLevel || "all"}
                  onChange={(e) =>
                    handleInputChange("skillLevel", e.target.value)
                  }
                >
                  <option value="all">Tutti i livelli</option>
                  <option value="tutti">Tutti</option>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzato">Avanzato</option>
                  <option value="professionista">Professionista</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Event Type */}
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label>Tipo Evento</Form.Label>
                <Form.Select
                  value={filters.eventType || "all"}
                  onChange={(e) =>
                    handleInputChange("eventType", e.target.value)
                  }
                >
                  <option value="all">Tutti i tipi</option>
                  <option value="workshop">Workshop</option>
                  <option value="social">Social</option>
                  <option value="festival">Festival</option>
                  <option value="competizione">Competizione</option>
                  <option value="corso">Corso</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Max Price */}
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label>
                  <Euro size={16} className="me-2" />
                  Prezzo Massimo
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Es. 25"
                  min="0"
                  step="1"
                  value={filters.priceMax || ""}
                  onChange={(e) =>
                    handleInputChange("priceMax", e.target.value)
                  }
                />
              </Form.Group>
            </Col>

            {/* Date From */}
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label>
                  <Calendar size={16} className="me-2" />
                  Data Da
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) =>
                    handleInputChange("dateFrom", e.target.value)
                  }
                />
              </Form.Group>
            </Col>

            {/* Date To */}
            <Col md={6} lg={4} className="mb-3">
              <Form.Group>
                <Form.Label>
                  <Calendar size={16} className="me-2" />
                  Data A
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => handleInputChange("dateTo", e.target.value)}
                />
              </Form.Group>
            </Col>

            {/* Action Buttons */}
            <Col md={6} lg={4} className="mb-3 d-flex align-items-end">
              <div className="w-100">
                <Button type="submit" variant="primary" className="w-100 mb-2">
                  Applica Filtri
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={onClearFilters}
                >
                  Pulisci Tutto
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default EventFilters;
