import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { apiService } from "../../services/api";
import toast from "react-hot-toast";

const AdminUserModal = ({ user, show, onHide, onUserUpdate }) => {
  const [formData, setFormData] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        isVerified: user.isVerified || false,
      });
    }
  }, [user]);

  if (!user) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdate = async () => {
    const toastId = toast.loading("Aggiornamento utente...");
    try {
      const updatedUser = await apiService.admin.updateUser(user._id, formData);
      toast.success("Utente aggiornato con successo!", { id: toastId });
      onUserUpdate(); // Funzione per aggiornare la lista utenti nel pannello
      onHide();
    } catch (error) {
      toast.error(error.message || "Errore durante l'aggiornamento.", {
        id: toastId,
      });
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        `Sei sicuro di voler eliminare l'utente ${user.name}? Questa azione è irreversibile.`
      )
    ) {
      const toastId = toast.loading("Eliminazione utente...");
      try {
        await apiService.admin.deleteUser(user._id);
        toast.success("Utente eliminato.", { id: toastId });
        onUserUpdate();
        onHide();
      } catch (error) {
        toast.error(error.message || "Errore durante l'eliminazione.", {
          id: toastId,
        });
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Gestisci Utente: {user.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Ruolo</Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>
        <hr />
        <Alert variant="danger">
          <Alert.Heading>Zona Pericolosa</Alert.Heading>
          <p>
            L'eliminazione di un utente è un'azione permanente e non può essere
            annullata. Rimuoverà l'utente dalla piattaforma.
          </p>
          <Button
            variant="outline-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminazione..." : "Elimina questo utente"}
          </Button>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Annulla
        </Button>
        <Button variant="primary" onClick={handleUpdate}>
          Salva Modifiche
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdminUserModal;