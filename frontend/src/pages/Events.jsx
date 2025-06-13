import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Search, Filter, Calendar, MapPin } from "lucide-react";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EventCard from "../components/events/EventCard";
import EventFilters from "../components/events/EventFilter";
import toast from "react-hot-toast";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    danceStyle: "all",
    skillLevel: "all",
    eventType: "all",
    city: "all",
    dateFrom: "",
    dateTo: "",
    priceMax: "",
    page: 1,
    limit: 12,
  });

  useEffect(() => {
    fetchEvents();
  }, [filters.page]); // Reload when page changes

  useEffect(() => {
    // Apply local filters when events change
    applyLocalFilters();
  }, [events, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Build API filters (only send non-empty values)
      const apiFilters = {};

      if (filters.search && filters.search.trim()) {
        apiFilters.search = filters.search.trim();
      }

      if (filters.danceStyle && filters.danceStyle !== "all") {
        apiFilters.danceStyle = filters.danceStyle;
      }

      if (filters.skillLevel && filters.skillLevel !== "all") {
        apiFilters.skillLevel = filters.skillLevel;
      }

      if (filters.eventType && filters.eventType !== "all") {
        apiFilters.eventType = filters.eventType;
      }

      if (filters.city && filters.city !== "all") {
        apiFilters.city = filters.city;
      }

      if (filters.dateFrom) {
        apiFilters.dateFrom = filters.dateFrom;
      }

      if (filters.dateTo) {
        apiFilters.dateTo = filters.dateTo;
      }

      // Add pagination
      apiFilters.page = filters.page;
      apiFilters.limit = filters.limit;

      const response = await apiService.events.getAll(apiFilters);

      setEvents(response.data || []);

      // 3. Ricostruisci l'oggetto di paginazione
      const totalEvents = response.total || 0;
      const totalPages = Math.ceil(totalEvents / filters.limit);

      setPagination({
        page: filters.page,
        pages: totalPages,
        total: totalEvents,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Errore nel caricamento eventi");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFilters = () => {
    let filtered = [...events];

    // Price filter (applied locally since API doesn't handle it)
    if (filters.priceMax && filters.priceMax !== "") {
      filtered = filtered.filter(
        (event) => event.price <= parseInt(filters.priceMax)
      );
    }

    // Sort by date (upcoming first) and featured
    filtered.sort((a, b) => {
      // Featured events first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Then by date
      return new Date(a.dateTime) - new Date(b.dateTime);
    });

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleApplyFilters = () => {
    // Reset to first page and fetch
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchEvents();
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      danceStyle: "all",
      skillLevel: "all",
      eventType: "all",
      city: "all",
      dateFrom: "",
      dateTo: "",
      priceMax: "",
      page: 1,
      limit: 12,
    });
    // Fetch will be triggered by useEffect
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      (filters.danceStyle && filters.danceStyle !== "all") ||
      (filters.skillLevel && filters.skillLevel !== "all") ||
      (filters.eventType && filters.eventType !== "all") ||
      (filters.city && filters.city !== "all") ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.priceMax
    );
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return <LoadingSpinner text="Caricamento eventi..." />;
  }

  return (
    <Container className="py-4">
      {/* Page Header */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-3">
          <Calendar className="me-3" size={48} />
          Eventi di Danza Caraibica
        </h1>
        <p className="lead text-muted">
          Scopri tutti gli eventi di salsa, bachata, kizomba e molto altro!
        </p>
      </div>

      {/* Filters Toggle */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">
                {pagination.total || filteredEvents.length}{" "}
                {(pagination.total || filteredEvents.length) === 1
                  ? "evento trovato"
                  : "eventi trovati"}
              </h5>
              {hasActiveFilters() && (
                <small className="text-muted">
                  Filtri attivi •
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 ms-1"
                    onClick={clearFilters}
                  >
                    Rimuovi filtri
                  </Button>
                </small>
              )}
            </div>

            <Button
              variant="outline-primary"
              onClick={() => setShowFilters(!showFilters)}
              className="d-flex align-items-center"
            >
              <Filter size={18} className="me-2" />
              {showFilters ? "Nascondi Filtri" : "Mostra Filtri"}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      {showFilters && (
        <EventFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          onApplyFilters={handleApplyFilters}
        />
      )}

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <>
          <Row>
            {filteredEvents.map((event) => (
              <Col key={event._id} lg={4} md={6} className="mb-4">
                <EventCard
                  event={{
                    ...event,
                    // Map backend fields to frontend expected format
                    id: event._id,
                    date: event.dateTime,
                    venue: event.location?.venue,
                    city: event.location?.city,
                    genre: event.danceStyle,
                    type: event.eventType,
                    level: event.skillLevel,
                    organizer: event.organizer || { name: "Organizzatore" },
                    tags: event.tags || [],
                    participants: event.currentParticipants || 0,
                    maxParticipants: event.maxParticipants,
                  }}
                />
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination">
                  <li
                    className={`page-item ${
                      pagination.page === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Precedente
                    </button>
                  </li>

                  {[...Array(Math.min(pagination.pages, 5))].map((_, index) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = index + 1;
                    } else {
                      const current = pagination.page;
                      const total = pagination.pages;

                      if (current <= 3) {
                        pageNum = index + 1;
                      } else if (current >= total - 2) {
                        pageNum = total - 4 + index;
                      } else {
                        pageNum = current - 2 + index;
                      }
                    }

                    return (
                      <li
                        key={pageNum}
                        className={`page-item ${
                          pagination.page === pageNum ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}

                  <li
                    className={`page-item ${
                      pagination.page === pagination.pages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Successiva
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-5">
          <div className="mb-4">
            {hasActiveFilters() ? (
              <Search size={64} className="text-muted" />
            ) : (
              <Calendar size={64} className="text-muted" />
            )}
          </div>

          <h4 className="mb-3">
            {hasActiveFilters()
              ? "Nessun evento trovato"
              : "Nessun evento disponibile"}
          </h4>

          <p className="text-muted mb-4">
            {hasActiveFilters()
              ? "Prova a modificare i filtri di ricerca per trovare eventi che corrispondono ai tuoi criteri."
              : "Non ci sono eventi programmati al momento. Torna presto per nuovi aggiornamenti!"}
          </p>

          {hasActiveFilters() && (
            <Button variant="primary" onClick={clearFilters} className="me-3">
              Rimuovi Filtri
            </Button>
          )}
        </div>
      )}

      {/* Load More Button (for future infinite scroll) */}
      {filteredEvents.length > 0 && pagination.pages > pagination.page && (
        <div className="text-center mt-4">
          <Button
            variant="outline-primary"
            size="lg"
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Carica Altri Eventi
          </Button>
        </div>
      )}
    </Container>
  );
};

export default Events;
