/* eslint-disable react-refresh/only-export-components */
import React, { useState } from "react";
import { Button, Dropdown, Modal, Alert, Form } from "react-bootstrap";
import { Calendar, Download, Plus, Clock, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { FaCalendar, FaGoogle } from "react-icons/fa";

const CalendarExport = ({ event, events = [], type = "single" }) => {
  const [showModal, setShowModal] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(60);
  const [includeDescription, setIncludeDescription] = useState(true);

  const validateEventData = (eventData) => {
    if (!eventData) return null;

    return {
      id: eventData._id || eventData.id,
      title: eventData.title || "Evento",
      description: eventData.description || "",
      date: eventData.dateTime || eventData.date,
      endDate: eventData.endDateTime || eventData.endDate,
      venue: eventData.location?.venue || "Venue non specificato",
      address: eventData.location?.address || "",
      city: eventData.location?.city || "",
      genre: eventData.danceStyle || "dance",
      price: eventData.price || 0,
      organizer: {
        name: eventData.organizer?.name || "Organizzatore",
      },
    };
  };

  // Create ICS (iCalendar) file content
  const createICSContent = (eventData, reminder = 60) => {
    const validatedEvent = validateEventData(eventData);
    if (!validatedEvent) return "";

    const formatICSDate = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const escapeICSText = (text) => {
      return String(text || "")
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "");
    };

    const startDate = formatICSDate(validatedEvent.date);
    const endDate = validatedEvent.endDate
      ? formatICSDate(validatedEvent.endDate)
      : formatICSDate(
          new Date(new Date(validatedEvent.date).getTime() + 2 * 60 * 60 * 1000)
        ); // +2 hours default

    const location = `${validatedEvent.venue}, ${validatedEvent.address}, ${validatedEvent.city}`;
    const description = includeDescription
      ? `${validatedEvent.description}\\n\\nOrganizzatore: ${
          validatedEvent.organizer.name
        }\\n\\nPrezzo: ${
          validatedEvent.price === 0 ? "Gratuito" : "€" + validatedEvent.price
        }\\n\\nMaggiori info: ${window.location.origin}/events/${
          validatedEvent.id
        }`
      : `Evento di danza caraibica - ${validatedEvent.genre}`;

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//RitmoCaribe//Event Calendar//IT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${validatedEvent.id}@ritmocaribe.com`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${escapeICSText(validatedEvent.title)}`,
      `DESCRIPTION:${escapeICSText(description)}`,
      `LOCATION:${escapeICSText(location)}`,
      `ORGANIZER;CN=${escapeICSText(
        validatedEvent.organizer.name
      )}:MAILTO:info@ritmocaribe.com`,
      `CATEGORIES:${validatedEvent.genre.toUpperCase()},DANCE,ENTERTAINMENT`,
      `STATUS:CONFIRMED`,
      `TRANSP:OPAQUE`,
      `CREATED:${formatICSDate(new Date())}`,
      `LAST-MODIFIED:${formatICSDate(new Date())}`,
    ];

    // Add reminder alarm
    if (reminder > 0) {
      icsContent.push(
        "BEGIN:VALARM",
        "TRIGGER:-PT" + reminder + "M",
        "ACTION:DISPLAY",
        `DESCRIPTION:Reminder: ${escapeICSText(validatedEvent.title)}`,
        "END:VALARM"
      );
    }

    icsContent.push("END:VEVENT", "END:VCALENDAR");

    return icsContent.join("\r\n");
  };

  // Download ICS file
  const downloadICS = (eventData = event) => {
    const validatedEvent = validateEventData(eventData);
    if (!validatedEvent) {
      toast.error("Dati evento non validi");
      return;
    }

    const icsContent = createICSContent(validatedEvent, reminderMinutes);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${validatedEvent.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("File calendario scaricato!");
  };

  // Download multiple events
  const downloadMultipleEvents = () => {
    const validEvents = events.map(validateEventData).filter(Boolean);
    if (validEvents.length === 0) {
      toast.error("Nessun evento valido trovato");
      return;
    }

    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//RitmoCaribe//Event Calendar//IT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    validEvents.forEach((eventData) => {
      const singleEventICS = createICSContent(eventData, reminderMinutes);
      const eventLines = singleEventICS.split("\r\n").slice(5, -1); // Remove VCALENDAR wrapper
      icsContent = icsContent.concat(eventLines);
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ritmo_caribe_eventi.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`${validEvents.length} eventi scaricati nel calendario!`);
  };

  // Add to Google Calendar
  const addToGoogleCalendar = (eventData = event) => {
    const validatedEvent = validateEventData(eventData);
    if (!validatedEvent) {
      toast.error("Dati evento non validi");
      return;
    }

    const startDate =
      new Date(validatedEvent.date)
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0] + "Z";
    const endDate = validatedEvent.endDate
      ? new Date(validatedEvent.endDate)
          .toISOString()
          .replace(/[-:]/g, "")
          .split(".")[0] + "Z"
      : new Date(new Date(validatedEvent.date).getTime() + 2 * 60 * 60 * 1000)
          .toISOString()
          .replace(/[-:]/g, "")
          .split(".")[0] + "Z";

    const details = `${validatedEvent.description}\n\nOrganizzatore: ${
      validatedEvent.organizer.name
    }\nPrezzo: ${
      validatedEvent.price === 0 ? "Gratuito" : "€" + validatedEvent.price
    }\n\nMaggiori info: ${window.location.origin}/events/${validatedEvent.id}`;
    const location = `${validatedEvent.venue}, ${validatedEvent.address}, ${validatedEvent.city}`;

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      validatedEvent.title
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
      details
    )}&location=${encodeURIComponent(location)}&sf=true&output=xml`;

    window.open(googleUrl, "_blank");
  };

  if (type === "single" && !event) {
    return null;
  }

  if (type === "multiple" && (!events || events.length === 0)) {
    return null;
  }

  const validatedMainEvent =
    type === "single" ? validateEventData(event) : null;

  return (
    <>
      <Dropdown drop="up" className="social-dropdown" strategy="fixed">
        <Dropdown.Toggle
          variant="outline-primary"
          size="sm"
          className="d-flex align-items-center w-100 justify-content-center"
        >
          <Calendar size={16} className="me-2" />
          Calendario
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {type === "single" ? (
            <>
              <Dropdown.Item onClick={() => addToGoogleCalendar()}>
                <div className="d-flex align-items-center">
                  <FaGoogle
                    size={16}
                    className="me-2"
                    style={{ color: "#1DA1F2" }}
                  />
                  Google Calendar
                </div>
              </Dropdown.Item>

              <Dropdown.Divider />

              <Dropdown.Item onClick={() => setShowModal(true)}>
                <Download size={16} className="me-2" />
                Scarica File ICS
              </Dropdown.Item>
            </>
          ) : (
            <>
              <Dropdown.Item onClick={() => setShowModal(true)}>
                <Download size={16} className="me-2" />
                Scarica Tutti ({events.length} eventi)
              </Dropdown.Item>

              <Dropdown.Divider />

              {events.slice(0, 3).map((evt) => (
                <Dropdown.Item
                  key={evt._id || evt.id}
                  onClick={() => addToGoogleCalendar(evt)}
                >
                  <div className="d-flex align-items-center">
                    <Plus size={14} className="me-2" />
                    <div>
                      <div className="small fw-semibold">{evt.title}</div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {new Date(evt.dateTime || evt.date).toLocaleDateString(
                          "it-IT"
                        )}
                      </div>
                    </div>
                  </div>
                </Dropdown.Item>
              ))}

              {events.length > 3 && (
                <Dropdown.Item className="text-muted small">
                  ...e altri {events.length - 3} eventi
                </Dropdown.Item>
              )}
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>

      {/* Export Options Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <Calendar className="me-2" size={20} />
            {type === "single" ? "Esporta Evento" : "Esporta Eventi"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Event Preview */}
          {type === "single" && validatedMainEvent && (
            <div className="mb-4">
              <div className="d-flex align-items-start">
                <img
                  src={event.image || "https://via.placeholder.com/60x60"}
                  alt={validatedMainEvent.title}
                  className="rounded me-3"
                  style={{ width: "60px", height: "60px", objectFit: "cover" }}
                />
                <div>
                  <h6 className="mb-1">{validatedMainEvent.title}</h6>
                  <div className="small text-muted">
                    <div className="d-flex align-items-center mb-1">
                      <Clock size={12} className="me-1" />
                      {new Date(validatedMainEvent.date).toLocaleDateString(
                        "it-IT"
                      )}{" "}
                      -{" "}
                      {new Date(validatedMainEvent.date).toLocaleTimeString(
                        "it-IT",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                    <div className="d-flex align-items-center">
                      <MapPin size={12} className="me-1" />
                      {validatedMainEvent.venue}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === "multiple" && (
            <div className="mb-4">
              <Alert variant="info">
                <strong>Esportazione multipla:</strong> Stai per scaricare{" "}
                {events.length} eventi in un unico file calendario.
              </Alert>
            </div>
          )}

          {/* Export Options */}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Promemoria</Form.Label>
              <Form.Select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
              >
                <option value={0}>Nessun promemoria</option>
                <option value={15}>15 minuti prima</option>
                <option value={30}>30 minuti prima</option>
                <option value={60}>1 ora prima</option>
                <option value={120}>2 ore prima</option>
                <option value={1440}>1 giorno prima</option>
                <option value={2880}>2 giorni prima</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Includi descrizione completa"
                checked={includeDescription}
                onChange={(e) => setIncludeDescription(e.target.checked)}
              />
              <Form.Text className="text-muted">
                Include dettagli evento, organizzatore e link
              </Form.Text>
            </Form.Group>
          </Form>

          {/* Quick Add Buttons */}
          <div className="mb-3">
            <h6 className="small mb-2">Aggiungi rapidamente a:</h6>
            <div className="d-grid gap-2">
              <Button
                variant="outline-primary"
                onClick={() => {
                  type === "single"
                    ? addToGoogleCalendar()
                    : events.forEach(addToGoogleCalendar);
                  setShowModal(false);
                }}
              >
                📅 Google Calendar
              </Button>
            </div>
          </div>

          {/* File Format Info */}
          <Alert variant="light" className="small">
            <strong>📄 Formato ICS:</strong> Il file scaricato è compatibile con
            tutti i principali calendari (Google, Outlook, Apple, Thunderbird,
            ecc.). Basta aprirlo o importarlo nell'applicazione calendario
            preferita.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
          >
            Annulla
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              type === "single" ? downloadICS() : downloadMultipleEvents();
              setShowModal(false);
            }}
          >
            <Download size={16} className="me-2" />
            Scarica File ICS
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

// Utility function to check if browser supports native calendar
export const supportsNativeCalendar = () => {
  return "calendar" in window || "webkitCalendar" in window;
};

// Utility function to create calendar reminder
export const createCalendarReminder = (event, reminderMinutes = 60) => {
  const eventDate = event?.dateTime || event?.date;
  if (!eventDate) return;

  const reminderDate = new Date(
    new Date(eventDate).getTime() - reminderMinutes * 60 * 1000
  );

  if ("Notification" in window && Notification.permission === "granted") {
    setTimeout(() => {
      new Notification(`Promemoria: ${event.title || "Evento"}`, {
        body: `L'evento inizia tra ${reminderMinutes} minuti`,
        icon: event.image || "/favicon.ico",
        tag: `event-${event._id || event.id}`,
      });
    }, reminderDate.getTime() - Date.now());
  }
};

export default CalendarExport;
