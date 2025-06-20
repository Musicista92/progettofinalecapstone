import React, { useState, useEffect } from "react";
import { Card, Form, Button, Alert, Modal, Dropdown } from "react-bootstrap";
import {
  Star,
  Heart,
  MessageCircle,
  Send,
  ThumbsUp,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import { formatDate, getEventStatus } from "../../utils/dateUtils";
import toast from "react-hot-toast";

const CommentsSection = ({ event, onEventUpdate }) => {
  const { user: _user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  // Edit states
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);

  const eventStatus = getEventStatus(
    event.dateTime || event.date,
    event.endDateTime || event.endDate
  );
  const canComment =
    isAuthenticated && (eventStatus === "ended" || eventStatus === "live");
  const canOnlyComment = isAuthenticated && eventStatus === "upcoming";

  useEffect(() => {
    fetchComments();
  }, [event]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const eventId = event._id || event.id;
      const response = await apiService.comments.getEventComments(eventId);
      setComments(response.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Errore nel caricamento dei commenti");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim() && newRating === 0) {
      toast.error("Inserisci un commento o una valutazione");
      return;
    }

    setLoading(true);
    try {
      const commentData = {
        content: newComment.trim(),
        rating: newRating || null,
      };

      const eventId = event._id || event.id;
      const newCommentObj = await apiService.comments.add(eventId, commentData);

      // Aggiungi il nuovo commento alla lista
      setComments((prev) => [newCommentObj, ...prev]);

      // Reset form
      setNewComment("");
      setNewRating(0);
      setShowCommentForm(false);

      toast.success("Commento aggiunto con successo!");

      // Update event if a rating was provided
      if (onEventUpdate && newRating > 0) {
        onEventUpdate();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Errore durante l'aggiunta del commento");
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (e) => {
    e.preventDefault();

    if (!editContent.trim() && editRating === 0) {
      toast.error("Inserisci un commento o una valutazione");
      return;
    }

    setLoading(true);
    try {
      const commentData = {
        content: editContent.trim(),
        rating: editRating || null,
      };

      const updatedComment = await apiService.comments.update(
        editingComment._id,
        commentData
      );

      // Aggiorna il commento nella lista
      setComments((prev) =>
        prev.map((comment) =>
          (comment._id || comment.id) === editingComment._id
            ? {
              ...comment,
              ...updatedComment,
              isEdited: true,
              editedAt: new Date(),
            }
            : comment
        )
      );

      // Reset edit state
      setEditingComment(null);
      setEditContent("");
      setEditRating(0);

      toast.success("Commento modificato con successo!");

      // Update event if a rating was provided
      if (onEventUpdate && editRating > 0) {
        onEventUpdate();
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Errore durante la modifica del commento");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo commento?")) {
      return;
    }

    try {
      await apiService.comments.delete(commentId);

      // Rimuovi il commento dalla lista
      setComments((prev) =>
        prev.filter((comment) => (comment._id || comment.id) !== commentId)
      );

      toast.success("Commento eliminato con successo!");

      // Update event stats
      if (onEventUpdate) {
        onEventUpdate();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Errore durante l'eliminazione del commento");
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      toast.error("Devi essere autenticato per mettere like");
      return;
    }

    try {
      const result = await apiService.comments.toggleLike(commentId);

      setComments((prev) =>
        prev.map((comment) => {
          const id = comment._id || comment.id;
          if (id === commentId) {
            return {
              ...comment,
              likesCount: result.likesCount,
              isLiked: result.isLiked,
              likes: result.isLiked
                ? [...(comment.likes || []), { user: _user._id }]
                : (comment.likes || []).filter(
                  (like) => like.user !== _user._id
                ),
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Errore durante l'operazione");
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment);
    setEditContent(comment.content || "");
    setEditRating(comment.rating || 0);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
    setEditRating(0);
    setEditHoverRating(0);
  };

  const renderStarRating = (
    rating,
    interactive = false,
    onRate = null,
    isEdit = false
  ) => {
    const currentRating = isEdit
      ? editHoverRating || editRating
      : interactive
        ? hoverRating || newRating
        : rating;
    const setHover = isEdit ? setEditHoverRating : setHoverRating;

    return (
      <div className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={interactive ? 20 : 16}
            className={`${interactive ? "me-1" : "me-0"} ${star <= currentRating ? "text-warning" : "text-muted"
              } ${interactive ? "cursor-pointer" : ""}`}
            fill={star <= currentRating ? "currentColor" : "none"}
            onClick={interactive ? () => onRate(star) : undefined}
            onMouseEnter={interactive ? () => setHover(star) : undefined}
            onMouseLeave={interactive ? () => setHover(0) : undefined}
            style={{ cursor: interactive ? "pointer" : "default" }}
          />
        ))}
        {!interactive && (
          <span className="ms-2 small text-muted">{rating}/5</span>
        )}
      </div>
    );
  };

  if (loadingComments) {
    return (
      <Card className="card-custom">
        <Card.Body className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento commenti...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="card-custom">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <MessageCircle className="me-2" size={20} />
          Recensioni e Commenti ({comments.length})
        </h5>

        {(canComment || canOnlyComment) && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowCommentForm(true)}
          >
            <MessageCircle size={14} className="me-1" />
            {canComment ? "Scrivi Recensione" : "Commenta"}
          </Button>
        )}
      </Card.Header>

      <Card.Body>
        {/* Event Status Info */}
        {!isAuthenticated && (
          <Alert variant="info" className="mb-3">
            <strong>Accedi per commentare:</strong> Registrati per lasciare
            commenti e recensioni.
          </Alert>
        )}

        {isAuthenticated && eventStatus === "upcoming" && (
          <Alert variant="warning" className="mb-3">
            <strong>Evento futuro:</strong> Potrai lasciare una recensione
            completa dopo l'evento. Per ora puoi solo commentare.
          </Alert>
        )}

        {/* Comments List */}
        {comments.length > 0 ? (
          <div>
            {comments.map((comment) => {
              const commentId = comment._id || comment.id;
              const authorName = comment.author?.name || "Utente";
              const authorAvatar =
                comment.author?.avatar || "/default-avatar.png";
              const commentDate = comment.createdAt || new Date().toISOString();
              const likesCount = comment.likesCount || 0;
              const isMyComment = _user && comment.author?._id === _user._id;

              // Check if current user has liked this comment
              const hasLiked =
                comment.likes?.some((like) => like.user === _user?._id) ||
                false;

              return (
                <div key={commentId} className="border-bottom pb-3 mb-3">
                  <div className="d-flex align-items-start">
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      className="rounded-circle me-3"
                      style={{
                        width: "40px",
                        height: "40px",
                        objectFit: "cover",
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div className="d-flex align-items-center">
                          <h6 className="mb-0">{authorName}</h6>
                          {comment.isEdited && (
                            <small className="text-muted ms-2">
                              (modificato)
                            </small>
                          )}
                        </div>
                        <div className="d-flex align-items-center">
                          <small className="text-muted me-2">
                            {formatDate(commentDate, "datetime")}
                          </small>
                          {isMyComment && (
                            <Dropdown>
                              <Dropdown.Toggle
                                variant="link"
                                size="sm"
                                className="p-0 text-muted border-0"
                                style={{ background: "none" }}
                              >
                                <MoreVertical size={16} />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item
                                  onClick={() => startEditing(comment)}
                                >
                                  <Edit2 size={14} className="me-2" />
                                  Modifica
                                </Dropdown.Item>
                                <Dropdown.Item
                                  className="text-danger"
                                  onClick={() => handleDeleteComment(commentId)}
                                >
                                  <Trash2 size={14} className="me-2" />
                                  Elimina
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          )}
                        </div>
                      </div>

                      {/* Editing form */}
                      {editingComment && editingComment._id === commentId ? (
                        <Form onSubmit={handleEditComment} className="mb-2">
                          {canComment && (
                            <Form.Group className="mb-2">
                              <Form.Label className="small">
                                Valutazione
                              </Form.Label>
                              <div>
                                {renderStarRating(
                                  editRating,
                                  true,
                                  setEditRating,
                                  true
                                )}
                              </div>
                            </Form.Group>
                          )}
                          <Form.Group className="mb-2">
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              placeholder="Modifica il tuo commento..."
                              maxLength={1000}
                            />
                          </Form.Group>
                          <div className="d-flex gap-2">
                            <Button
                              type="submit"
                              size="sm"
                              variant="primary"
                              disabled={
                                loading ||
                                (!editContent.trim() && editRating === 0)
                              }
                            >
                              Salva
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline-secondary"
                              onClick={cancelEditing}
                            >
                              Annulla
                            </Button>
                          </div>
                        </Form>
                      ) : (
                        <>
                          {/* Mostra le stelle se è una recensione */}
                          {comment.rating > 0 && (
                            <div className="mb-2">
                              {renderStarRating(comment.rating)}
                            </div>
                          )}

                          {comment.content && (
                            <p className="mb-2">{comment.content}</p>
                          )}

                          <div className="d-flex align-items-center">
                            <Button
                              size="sm"
                              variant="link"
                              className="p-0 text-muted"
                              onClick={() => handleLikeComment(commentId)}
                              disabled={!isAuthenticated}
                            >
                              <Heart
                                size={14}
                                className="me-1"
                                fill={hasLiked ? "currentColor" : "none"}
                              />
                              {likesCount > 0 && likesCount}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <MessageCircle size={48} className="text-muted mb-2" />
            <p className="text-muted">Nessun commento ancora</p>
            <small className="text-muted">
              {canComment
                ? "Sii il primo a lasciare una recensione!"
                : canOnlyComment
                  ? "Sii il primo a commentare!"
                  : "Accedi per commentare"}
            </small>
          </div>
        )}
      </Card.Body>

      {/* Comment Form Modal */}
      <Modal
        show={showCommentForm}
        onHide={() => setShowCommentForm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <MessageCircle className="me-2" size={20} />
            {canComment ? "Scrivi una Recensione" : "Aggiungi un Commento"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmitComment}>
          <Modal.Body>
            {/* Event Info */}
            <div className="d-flex align-items-center mb-3 p-2 bg-light rounded">
              <img
                src={event.image}
                alt={event.title}
                className="rounded me-3"
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
              />
              <div>
                <h6 className="mb-0">{event.title}</h6>
                <small className="text-muted">
                  {formatDate(event.dateTime || event.date, "short")}
                </small>
              </div>
            </div>

            {/* Rating (only for past events) */}
            {canComment && (
              <Form.Group className="mb-3">
                <Form.Label>Valutazione (opzionale)</Form.Label>
                <div className="mb-2">
                  {renderStarRating(newRating, true, setNewRating)}
                </div>
                <Form.Text className="text-muted">
                  Clicca sulle stelle per valutare l'evento
                </Form.Text>
              </Form.Group>
            )}

            {/* Comment Text */}
            <Form.Group className="mb-3">
              <Form.Label>
                {canComment ? "Recensione" : "Commento"}{" "}
                {canComment ? "(opzionale se hai dato una valutazione)" : "*"}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  canComment
                    ? "Racconta la tua esperienza... Come è stata la musica? I maestri? L'atmosfera?"
                    : "Scrivi un commento sull'evento..."
                }
                required={!canComment || (canComment && newRating === 0)}
                maxLength={1000}
              />
              <Form.Text className="text-muted">
                {newComment.length}/1000 caratteri
              </Form.Text>
            </Form.Group>

            {/* Guidelines */}
            <Alert variant="light" className="small">
              <strong>💡 Suggerimenti:</strong>
              <ul className="mb-0 mt-1">
                <li>Sii rispettoso verso organizzatori e partecipanti</li>
                <li>Condividi la tua esperienza in modo costruttivo</li>
                <li>Aiuta altri a capire cosa aspettarsi</li>
              </ul>
            </Alert>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setShowCommentForm(false)}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || (!newComment.trim() && newRating === 0)}
            >
              <Send size={14} className="me-2" />
              {loading ? "Pubblicazione..." : "Pubblica"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Card>
  );
};

export default CommentsSection;