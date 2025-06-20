// src/components/events/EventForm.js

import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Alert } from "react-bootstrap";
import {
  FileText,
  Calendar,
  MapPin,
  Tag,
  Euro,
  Users,
  Star,
  Wand2,
} from "lucide-react";
import { formatDateTimeForInput } from "../../utils/dateUtils";

// Valori che devono corrispondere al tuo backend
const EVENT_TYPES = [
  { value: "social", label: "🌙 Serata Social" },
  { value: "workshop", label: "🎓 Workshop/Stage" },
  { value: "festival", label: "🏆 Festival/Congresso" },
  { value: "competizione", label: "🏅 Competizione" },
  { value: "corso", label: "📚 Corso" },
];

const DANCE_STYLES = [
  { value: "salsa", label: "🔥 Salsa" },
  { value: "bachata", label: "💃 Bachata" },
  { value: "kizomba", label: "❤️ Kizomba" },
  { value: "merengue", label: "🇩🇴 Merengue" },
  { value: "reggaeton", label: "🎤 Reggaeton" },
  { value: "altro", label: "🎶 Altro" },
];

const SKILL_LEVELS = [
  { value: "tutti", label: "Tutti i livelli" },
  { value: "principiante", label: "Principiante" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzato", label: "Avanzato" },
  { value: "professionista", label: "Professionista" },
];

const EventForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  submitText = "Crea Evento",
}) => {
  // --- MODIFICA 1: Stato con i nomi corretti e campi aggiunti ---
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dateTime: "",
    endDateTime: "",
    eventType: "social",
    danceStyle: "salsa",
    skillLevel: "tutti", // Campo aggiunto!
    location: {
      venue: "",
      address: "",
      city: "Napoli",
    },
    price: "",
    maxParticipants: "",
    image: null, // Ora conterrà l'oggetto File, non Base64
    tags: "",
    requirements: "",
    // Campi opzionali aggiuntivi (se li usi nel backend)
    // dresscode: "",
    // parking: false,
    // accessible: false,
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (initialData) {
      // Logica per popolare il form in caso di modifica (più complessa con la nuova struttura)
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        dateTime: formatDateTimeForInput(initialData.dateTime),
        endDateTime: initialData.endDateTime
          ? formatDateTimeForInput(initialData.endDateTime)
          : "",
        eventType: initialData.eventType || "social",
        danceStyle: initialData.danceStyle || "salsa",
        skillLevel: initialData.skillLevel || "tutti",
        location: {
          venue: initialData.location?.venue || "",
          address: initialData.location?.address || "",
          city: initialData.location?.city || "Napoli",
        },
        price: initialData.price ?? "",
        maxParticipants: initialData.maxParticipants ?? "",
        image: null, // L'immagine va ricaricata in modifica
        tags: initialData.tags ? initialData.tags.join(", ") : "",
        requirements: initialData.requirements || "",
      });
      setImagePreview(initialData.image || "");
    }
  }, [initialData]);

  // Validazione (aggiornata per la nuova struttura)
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim() || formData.title.trim().length < 5)
      newErrors.title = "Titolo richiesto (min 5 caratteri)";
    if (!formData.description.trim() || formData.description.trim().length < 20)
      newErrors.description = "Descrizione richiesta (min 20 caratteri)";
    if (!formData.dateTime) newErrors.dateTime = "Data di inizio richiesta";
    if (new Date(formData.dateTime) <= new Date())
      newErrors.dateTime = "La data deve essere futura";
    if (
      formData.endDateTime &&
      new Date(formData.endDateTime) <= new Date(formData.dateTime)
    )
      newErrors.endDateTime = "La data di fine deve essere dopo l'inizio";
    if (!formData.location.venue.trim())
      newErrors.venue = "Nome locale richiesto";
    if (!formData.location.address.trim())
      newErrors.address = "Indirizzo richiesto";
    if (formData.price && (isNaN(formData.price) || formData.price < 0))
      newErrors.price = "Prezzo non valido";
    if (
      !formData.maxParticipants ||
      isNaN(formData.maxParticipants) ||
      formData.maxParticipants < 1
    )
      newErrors.maxParticipants = "Capacità non valida";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Gestione per l'oggetto 'location'
    if (name.startsWith("location.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // --- MODIFICA 2: Gestisce il file, non Base64 ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file })); // Salva l'oggetto File
      setImagePreview(URL.createObjectURL(file)); // Crea una preview URL temporanea
    }
  };

  // --- MODIFICA 3: Usa FormData per l'invio ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    console.log("FORM DATA BEFORE", formData);
    // Crea un oggetto FormData per inviare dati e file insieme
    const dataToSubmit = new FormData();

    // Aggiunge tutti i campi al FormData
    dataToSubmit.append("title", formData.title);
    dataToSubmit.append("description", formData.description);
    dataToSubmit.append("dateTime", formData.dateTime);
    if (formData.endDateTime) {
      dataToSubmit.append("endDateTime", formData.endDateTime);
    }
    dataToSubmit.append("eventType", formData.eventType);
    dataToSubmit.append("danceStyle", formData.danceStyle);
    dataToSubmit.append("skillLevel", formData.skillLevel);

    // L'oggetto location va inviato come stringa JSON
    dataToSubmit.append("location", JSON.stringify(formData.location));

    dataToSubmit.append(
      "price",
      formData.price ? parseFloat(formData.price) : 0
    );
    dataToSubmit.append("maxParticipants", parseInt(formData.maxParticipants));

    // Aggiunge il file solo se è stato selezionato
    if (formData.image) {
      dataToSubmit.append("eventImage", formData.image);
    }

    // I tag vanno inviati come stringa JSON
    const tagsArray = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    dataToSubmit.append("tags", JSON.stringify(tagsArray));

    dataToSubmit.append("requirements", formData.requirements);
    onSubmit(dataToSubmit); // Invia l'oggetto FormData
  };

  const handleAutofill = () => {
    // Genera date valide per il test
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 3); // Fra 3 giorni
    startDate.setHours(22, 0, 0, 0); // Alle 22:00

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 3); // 3 ore dopo

    const mockData = {
      title: "Serata Caraibica di Prova",
      description:
        "Questa è una descrizione di prova per un evento generato automaticamente. L'obiettivo è testare la funzionalità del form in modo rapido ed efficiente, assicurando che tutti i campi siano validi.",
      dateTime: formatDateTimeForInput(startDate),
      endDateTime: formatDateTimeForInput(endDate),
      eventType: "social",
      danceStyle: "bachata",
      skillLevel: "intermedio",
      location: {
        venue: "Locale di Prova 'La Fiesta'",
        address: "Via Roma 123, 80100",
        city: "Napoli",
      },
      price: "15.50",
      maxParticipants: "150",
      tags: "bachata, sensual, principianti, serata danzante",
      requirements:
        "Nessun requisito particolare, solo tanta voglia di ballare!",
    };

    // Aggiorna lo stato, mantenendo l'immagine esistente (se c'è)
    setFormData((prev) => ({
      ...prev,
      ...mockData,
    }));

    // Resetta gli errori
    setErrors({});
  };

  return (
    <Form onSubmit={handleSubmit} className="form-custom">
      <div className="text-center mb-4">
        <Button variant="outline-primary" size="sm" onClick={handleAutofill}>
          <Wand2 size={16} className="me-2" />
          Autocompila per Test
        </Button>
      </div>
      {/* Informazioni Base */}
      <h5 className="mb-3">
        <FileText className="me-2" size={20} /> Informazioni Base
      </h5>
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Titolo Evento *</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="es. Notte di Salsa Caliente"
              isInvalid={!!errors.title}
            />
            <Form.Control.Feedback type="invalid">
              {errors.title}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Form.Group className="mb-4">
        <Form.Label>Descrizione *</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descrivi l'evento..."
          isInvalid={!!errors.description}
        />
        <Form.Control.Feedback type="invalid">
          {errors.description}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Data e Orario */}
      <h5 className="mb-3">
        <Calendar className="me-2" size={20} /> Data e Orario
      </h5>
      <Row className="mb-4">
        {/* --- MODIFICA 4: Nomi dei campi aggiornati (name="dateTime") --- */}
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Data e Ora Inizio *</Form.Label>
            <Form.Control
              type="datetime-local"
              name="dateTime"
              value={formData.dateTime}
              onChange={handleChange}
              isInvalid={!!errors.dateTime}
            />
            <Form.Control.Feedback type="invalid">
              {errors.dateTime}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Data e Ora Fine (opzionale)</Form.Label>
            <Form.Control
              type="datetime-local"
              name="endDateTime"
              value={formData.endDateTime}
              onChange={handleChange}
              isInvalid={!!errors.endDateTime}
            />
            <Form.Control.Feedback type="invalid">
              {errors.endDateTime}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      {/* Luogo */}
      <h5 className="mb-3">
        <MapPin className="me-2" size={20} /> Luogo
      </h5>
      <Row className="mb-4">
        <Col md={8}>
          {/* --- MODIFICA 5: Nomi per campi annidati (name="location.venue") --- */}
          <Form.Group className="mb-3">
            <Form.Label>Nome Locale/Venue *</Form.Label>
            <Form.Control
              type="text"
              name="location.venue"
              value={formData.location.venue}
              onChange={handleChange}
              placeholder="es. Club Tropicana"
              isInvalid={!!errors.venue}
            />
            <Form.Control.Feedback type="invalid">
              {errors.venue}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Città *</Form.Label>
            <Form.Control
              type="text"
              name="location.city"
              value={formData.location.city}
              onChange={handleChange}
              isInvalid={!!errors.city}
            />
          </Form.Group>
        </Col>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Indirizzo Completo *</Form.Label>
            <Form.Control
              type="text"
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              placeholder="Via, numero civico, CAP"
              isInvalid={!!errors.address}
            />
            <Form.Control.Feedback type="invalid">
              {errors.address}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      {/* Dettagli Evento */}
      <h5 className="mb-3">
        <Tag className="me-2" size={20} /> Dettagli Evento
      </h5>
      <Row className="mb-4">
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Tipo di Evento *</Form.Label>
            {/* --- MODIFICA 6: Valori e nomi corretti --- */}
            <Form.Select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Stile di Danza *</Form.Label>
            <Form.Select
              name="danceStyle"
              value={formData.danceStyle}
              onChange={handleChange}
            >
              {DANCE_STYLES.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          {/* --- MODIFICA 7: Aggiunto campo Skill Level --- */}
          <Form.Group className="mb-3">
            <Form.Label>Livello Richiesto *</Form.Label>
            <Form.Select
              name="skillLevel"
              value={formData.skillLevel}
              onChange={handleChange}
            >
              {SKILL_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <Euro className="me-2" size={16} />
              Prezzo (€)
            </Form.Label>
            <Form.Control
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0 per gratuito"
              isInvalid={!!errors.price}
            />
            <Form.Control.Feedback type="invalid">
              {errors.price}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <Users className="me-2" size={16} />
              Capacità Massima *
            </Form.Label>
            <Form.Control
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              placeholder="100"
              isInvalid={!!errors.maxParticipants}
            />
            <Form.Control.Feedback type="invalid">
              {errors.maxParticipants}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Tags (separati da virgola)</Form.Label>
            <Form.Control
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="principianti, cubana, bachata sensual..."
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Requisiti</Form.Label>
            <Form.Control
              type="text"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="es. Scarpe da ballo obbligatorie"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Image Upload */}
      <h5 className="mb-3">Immagine Evento</h5>
      <Form.Group className="mb-3">
        <Form.Label>Carica Locandina</Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
      </Form.Group>
      {imagePreview && (
        <div className="text-center mb-4">
          <img
            src={imagePreview}
            alt="Preview"
            className="img-fluid rounded"
            style={{ maxHeight: "250px" }}
          />
        </div>
      )}

      {/* Submit Buttons */}
      <div className="d-flex justify-content-end gap-3 mt-5">
        {onCancel && (
          <Button
            type="button"
            variant="outline-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Annulla
          </Button>
        )}
        <Button type="submit" className="btn-primary-custom" disabled={loading}>
          {loading ? "Salvataggio..." : submitText}
        </Button>
      </div>
    </Form>
  );
};

export default EventForm;