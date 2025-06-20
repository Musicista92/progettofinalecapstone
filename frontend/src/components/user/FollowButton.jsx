import React, { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { apiService } from "../../services/api";
import { useNavigate } from "react-router-dom";

const FollowButton = ({
  targetUser,
  isFollowing,
  onFollowToggle,
  size = "sm",
  className = "",
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Devi essere autenticato per seguire utenti.");
      navigate("/login");
      return;
    }

    if (!targetUser || !targetUser._id) {
      toast.error("Utente di destinazione non valido.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.users.toggleFollow(targetUser._id);
      if (onFollowToggle) {
        onFollowToggle(response);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error(error.message || "Errore durante l'operazione.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !targetUser || user?._id === targetUser._id) {
    return null;
  }

  return (
    <Button
      size={size}
      variant={isFollowing ? "primary" : "outline-primary"}
      onClick={handleToggleFollow}
      disabled={loading}
      className={`d-flex align-items-center justify-content-center ${className}`}
      style={{ minWidth: "120px", transition: "all 0.2s ease-in-out" }}
    >
      {loading ? (
        <Spinner as="span" animation="border" size="sm" />
      ) : isFollowing ? (
        <>
          <UserCheck size={16} className="me-2" />
          Segui già
        </>
      ) : (
        <>
          <UserPlus size={16} className="me-2" />
          Segui
        </>
      )}
    </Button>
  );
};

export default FollowButton;