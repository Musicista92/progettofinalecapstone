import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { apiService } from "../../services/api";
import { useNavigate } from "react-router-dom";

const FollowButton = ({
  targetUser,
  onFollowToggle,
  size = "sm",
  variant = "primary",
  className = "",
}) => {
  const { user, updateUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && targetUser) {
      setIsFollowing(user.following?.includes(targetUser._id) || false);
    } else {
      setIsFollowing(false);
    }
  }, [user, targetUser, isAuthenticated]);

  const handleToggleFollow = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Devi essere autenticato per seguire utenti");
      navigate("/login");
      return;
    }

    if (user._id === targetUser._id) {
      toast.error("Non puoi seguire te stesso");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Operazione in corso...");

    try {
      const result = await apiService.users.toggleFollow(targetUser._id);

      const newIsFollowing = result.isFollowing;
      const newFollowersCount = result.followersCount;

      setIsFollowing(newIsFollowing);
      toast.success(result.message, { id: toastId });

      if (onFollowToggle) {
        onFollowToggle(newFollowersCount);
      }

      const updatedFollowing = newIsFollowing
        ? [...(user.following || []), targetUser._id]
        : (user.following || []).filter((id) => id !== targetUser._id);

      updateUser({ ...user, following: updatedFollowing });
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error(error.message || "Errore durante l'operazione", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  // Se non sono autenticato, o sto guardando il mio profilo, non mostro il pulsante
  if (!isAuthenticated || user?._id === targetUser?._id) {
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
