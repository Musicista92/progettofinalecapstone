import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dropdown,
  Badge,
  Button,
  Card,
  Modal,
  Tab,
  Tabs,
  Spinner,
} from "react-bootstrap";
import { Bell, Heart, UserPlus, Calendar, Check, X } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import { useNavigate } from "react-router-dom";

const NotificationSystem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // Usiamo useRef per evitare che il setInterval si resetti ad ogni render
  const intervalRef = useRef(null);

  // Funzione per caricare le notifiche
  const fetchNotifications = useCallback(async () => {
    if (!user) return; // Non fare nulla se l'utente non è loggato
    setLoading(true);
    try {
      const data = await apiService.notifications.get();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      toast.error("Impossibile caricare le notifiche.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Caricamento iniziale e polling per aggiornamenti
  useEffect(() => {
    fetchNotifications();

    // Imposta un intervallo per controllare nuove notifiche ogni minuto
    intervalRef.current = setInterval(fetchNotifications, 60000);

    // Pulisci l'intervallo quando il componente viene smontato
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    const originalNotifications = [...notifications];
    // Aggiornamento ottimistico dell'UI
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
    );
    // Aggiorna il contatore non letto
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiService.notifications.markAsRead(notificationId);
    } catch (error) {
      toast.error("Errore nel segnare la notifica come letta.");
      setNotifications(originalNotifications); // Ripristina in caso di errore
      setUnreadCount((prev) => prev + 1); // Ripristina il contatore
    }
  };

  const markAllAsRead = async () => {
    const originalNotifications = [...notifications];
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await apiService.notifications.markAllAsRead();
      toast.success("Tutte le notifiche segnate come lette");
    } catch (error) {
      toast.error("Errore nel segnare le notifiche come lette.");
      setNotifications(originalNotifications);
      // Ri-fetch per avere il conteggio corretto
      fetchNotifications();
    }
  };

  const deleteNotification = async (notificationId) => {
    const notificationToDelete = notifications.find(
      (n) => n._id === notificationId
    );
    const originalNotifications = [...notifications];

    // Aggiornamento ottimistico
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    if (notificationToDelete && !notificationToDelete.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await apiService.notifications.delete(notificationId);
      toast.success("Notifica eliminata.");
    } catch (error) {
      toast.error("Errore durante l'eliminazione.");
      setNotifications(originalNotifications);
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount((prev) => prev + 1);
      }
    }
  };

  // --- FUNZIONI HELPER ---

  const getNotificationIcon = (type) => {
    // ... (questa funzione rimane identica)
    switch (type) {
      case "new_event":
        return <Calendar size={16} className="text-primary" />;
      case "event_reminder":
        return <Bell size={16} className="text-warning" />;
      case "follow":
        return <UserPlus size={16} className="text-success" />;
      case "event_approved":
        return <Check size={16} className="text-success" />;
      case "like":
        return <Heart size={16} className="text-danger" />;
      default:
        return <Bell size={16} className="text-info" />;
    }
  };

  const handleNotificationClick = (notification) => {
    // Segna come letta se non lo è già
    if (!notification.read) {
      markAsRead(notification._id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else {
      // Fallback per vecchie notifiche o tipi non gestiti
      if (notification.data?.eventId) {
        navigate(`/events/${notification.data.eventId._id}`);
      } else if (notification.data?.fromUser) {
        navigate(`/users/${notification.data.fromUser._id}`);
      }
    }
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "events":
        return notifications.filter((n) =>
          [
            "new_event",
            "event_reminder",
            "event_approved",
            "event_rejected",
            "event_cancelled",
          ].includes(n.type)
        );
      case "social":
        return notifications.filter((n) =>
          ["follow", "like", "new_comment", "comment_reply"].includes(n.type)
        );
      default:
        return notifications;
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <Dropdown align="end">
        <Dropdown.Toggle
          variant="link"
          className="position-relative p-2 text-decoration-none"
          style={{ border: "none", background: "none" }}
        >
          <Bell size={20} className="text-white" />
          {unreadCount > 0 && (
            <Badge
              bg="danger"
              className="position-absolute top-0 start-100 translate-middle rounded-pill"
              style={{ fontSize: "0.6rem" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu
          style={{ width: "350px", maxHeight: "400px", overflowY: "auto" }}
        >
          <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Notifiche</h6>
            <div>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="link"
                  className="p-0 me-2"
                  onClick={markAllAsRead}
                >
                  <Check size={14} />
                </Button>
              )}
              <Button
                size="sm"
                variant="link"
                className="p-0"
                onClick={() => setShowModal(true)}
              >
                Vedi tutte
              </Button>
            </div>
          </div>

          {loading && (
            <div className="text-center p-3">
              <Spinner animation="border" size="sm" />
            </div>
          )}

          {!loading &&
            notifications.length > 0 &&
            notifications.slice(0, 5).map((notification) => (
              <Dropdown.Item
                key={notification._id}
                className={`px-3 py-2 ${!notification.read ? "bg-light" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* JSX INTERNO DELLA NOTIFICA */}
                <div className="d-flex align-items-start">
                  <div className="me-2 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold small">
                      {notification.title}
                    </div>
                    <div className="text-muted small">
                      {notification.message}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                      {formatDate(notification.createdAt, "time")}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="ms-2 mt-1">
                      <div
                        className="bg-primary rounded-circle"
                        style={{ width: "8px", height: "8px" }}
                      />
                    </div>
                  )}
                </div>
              </Dropdown.Item>
            ))}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-4 text-muted">
              <Bell size={32} className="mb-2" />
              <div>Nessuna notifica</div>
            </div>
          )}
        </Dropdown.Menu>
      </Dropdown>

      {/* Full Notifications Modal - Controlla l'accesso a notification.data */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <Bell className="me-2" size={20} /> Tutte le Notifiche
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key)}
            className="mb-3"
            fill
          >
            <Tab eventKey="all" title={`Tutte (${notifications.length})`} />
            <Tab eventKey="unread" title={`Non lette (${unreadCount})`} />
            <Tab eventKey="events" title="Eventi" />
            <Tab eventKey="social" title="Social" />
          </Tabs>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {getFilteredNotifications().map((notification) => (
              <Card
                key={notification._id}
                className={`mb-2 ${!notification.read ? "border-primary" : ""}`}
              >
                <Card.Body className="p-3">
                  <div className="d-flex align-items-start justify-content-between">
                    <div
                      className="d-flex align-items-start flex-grow-1"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="me-3">
                        {notification.data?.fromUser ? (
                          <img
                            src={notification.data.fromUser.avatar}
                            alt={notification.data.fromUser.name}
                            className="rounded-circle"
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "40px", height: "40px" }}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{notification.title}</div>
                        <div className="text-muted small mb-1">
                          {notification.message}
                        </div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {formatDate(notification.createdAt, "datetime")}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center ms-2">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-1"
                          onClick={() => markAsRead(notification._id)}
                        >
                          <Check size={12} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => deleteNotification(notification._id)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
            {getFilteredNotifications().length === 0 && (
              <div className="text-center py-4 text-muted">
                <Bell size={48} className="mb-2" />
                <div>Nessuna notifica in questa categoria</div>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default NotificationSystem;
