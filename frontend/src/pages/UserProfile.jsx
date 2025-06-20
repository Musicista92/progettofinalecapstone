import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Tabs,
  Tab,
  Spinner,
} from "react-bootstrap";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProfileEventRow from "../components/user/ProfileEventRow";
import UserListRow from "../components/user/UserListRow";
import FollowButton from "../components/user/FollowButton";
import {
  Mail,
  MapPin,
  Calendar,
  Heart,
  Users,
  CheckSquare,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { Form, InputGroup } from "react-bootstrap";
import { Edit3, Save, XCircle } from "lucide-react";

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [tabContent, setTabContent] = useState([]);
  const [isTabLoading, setIsTabLoading] = useState(false);

  //EDITING STATES
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", city: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);

  const handleFollowUpdate = useCallback((response) => {
    if (response.message) {
      toast.success(response.message);
    }

    setProfileUser((prev) => ({
      ...prev,
      isFollowing: response.data.isFollowing,
      followersCount: response.data.followersCount,
    }));
  }, []);

  const fetchTabData = useCallback(
    async (tabKey) => {
      if (!profileUser && tabKey !== "events") return;
      setIsTabLoading(true);
      setTabContent([]);

      try {
        let response;
        switch (tabKey) {
          case "favorites":
            response = await apiService.users.getFavourites(id);
            setTabContent(response.favourites || []);
            break;
          case "followers":
            response = await apiService.users.getFollowers(id);
            setTabContent(response.followers || []);
            break;
          case "following":
            response = await apiService.users.getFollowing(id);
            setTabContent(response.following || []);
            break;
          case "joined":
            if (isOwnProfile) {
              response = await apiService.events.getJoinedEvents();
              setTabContent(response.events || []);
            }
            break;
          case "events":
          default:
            setTabContent(profileUser.organizedEvents || []);
            break;
        }
      } catch (error) {
        toast.error(`Errore nel caricare la sezione ${tabKey}.`);
        console.error(`Fetch ${tabKey} error:`, error);
      } finally {
        setIsTabLoading(false);
      }
    },
    [id, profileUser, isOwnProfile]
  );

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await apiService.users.getById(id);
        const user = response.user;

        setProfileUser(user);
        setIsOwnProfile(currentUser?._id === user._id);
        setTabContent(user.organizedEvents || []);

        // Questo assicura che il form parta con i dati corretti
        if (user) {
          setEditData({
            name: user.name,
            city: user.location?.city || "",
          });
          setAvatarPreview(user.avatar);
        }
      } catch (error) {
        toast.error("Impossibile caricare il profilo utente.");
        setProfileUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserData();
    }
  }, [id, currentUser?._id]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Annulla modifiche
      setEditData({
        name: profileUser.name,
        city: profileUser.location?.city || "",
      });
      setAvatarFile(null);
      setAvatarPreview(profileUser.avatar);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async () => {
    const formData = new FormData();

    // Assicurati che i campi non siano undefined
    formData.append("name", editData.name || "");
    formData.append("city", editData.city || "");

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    setIsTabLoading(true);
    try {
      const response = await apiService.auth.updateProfile(formData);

      if (response.success && response.data) {
        setProfileUser((prev) => ({
          ...prev,
          name: response.data.name,
          location: response.data.location,
          avatar: response.data.avatar,
        }));

        // Aggiorna anche l'avatar preview se è stato cambiato
        if (response.data.avatar) {
          setAvatarPreview(response.data.avatar);
        }

        toast.success(response.message || "Profilo aggiornato con successo!");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Errore frontend:", error);
      toast.error(error.message || "Errore durante l'aggiornamento.");
    } finally {
      setIsTabLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Caricamento profilo..." />;
  if (!profileUser)
    return (
      <Container className="text-center py-5">
        <h2>Utente non trovato</h2>
      </Container>
    );

  return (
    <Container className="py-5">
      <Row className="align-items-start">
        <Col lg={4}>
          <Card
            className="card-custom mb-4 position-sticky"
            style={{ top: "20px" }}
          >
            <Card.Body className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleAvatarChange}
                accept="image/*"
              />
              <img
                src={avatarPreview}
                alt={profileUser.name}
                className="rounded-circle mb-3"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  cursor: isEditing ? "pointer" : "default",
                }}
                onClick={() => isEditing && fileInputRef.current.click()}
              />

              {isEditing ? (
                <Form.Control
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleInputChange}
                  className="h4 fw-bold text-center mb-1"
                />
              ) : (
                <h4 className="fw-bold">{profileUser.name}</h4>
              )}

              <p className="text-muted mb-1">
                {profileUser.role.charAt(0).toUpperCase() +
                  profileUser.role.slice(1)}
              </p>

              {isEditing ? (
                <InputGroup className="mb-3">
                  <InputGroup.Text>
                    <MapPin size={14} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="city"
                    placeholder="La tua città"
                    value={editData.city}
                    onChange={handleInputChange}
                  />
                </InputGroup>
              ) : (
                <p className="text-muted">
                  <MapPin size={14} />{" "}
                  {profileUser.location?.city || "Nessuna località"}
                </p>
              )}

              {isOwnProfile ? (
                isEditing ? (
                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      onClick={handleProfileUpdate}
                      disabled={isTabLoading}
                    >
                      <Save size={16} />{" "}
                      {isTabLoading ? "Salvataggio..." : "Salva Modifiche"}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={handleEditToggle}
                    >
                      <XCircle size={16} /> Annulla
                    </Button>
                  </div>
                ) : (
                  <Button variant="primary" onClick={handleEditToggle}>
                    <Edit3 size={16} /> Modifica Profilo
                  </Button>
                )
              ) : (
                <div className="d-grid col-8 mx-auto">
                  <FollowButton
                    targetUser={profileUser}
                    isFollowing={profileUser.isFollowing || false}
                    onFollowToggle={handleFollowUpdate}
                    size="md"
                  />
                </div>
              )}

              <div className="d-flex justify-content-around mt-4">
                <div>
                  <h5 className="fw-bold mb-0">
                    {(profileUser.organizedEvents || []).length}
                  </h5>
                  <small className="text-muted">Eventi</small>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">{profileUser.followersCount}</h5>
                  <small className="text-muted">Followers</small>
                </div>
                <div>
                  <h5 className="fw-bold mb-0">{profileUser.followingCount}</h5>
                  <small className="text-muted">Following</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={8}>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => {
              setActiveTab(k);
              fetchTabData(k);
            }}
            id="profile-tabs"
            className="mb-3"
          >
            <Tab
              eventKey="events"
              title={
                <span>
                  <Calendar size={16} className="me-2" /> Eventi Creati
                </span>
              }
            />
            {isOwnProfile && (
              <Tab
                eventKey="joined"
                title={
                  <span>
                    <CheckSquare size={16} className="me-2" /> Partecipo
                  </span>
                }
              />
            )}
            <Tab
              eventKey="favorites"
              title={
                <span>
                  <Heart size={16} className="me-2" /> Preferiti
                </span>
              }
            />
            <Tab
              eventKey="followers"
              title={
                <span>
                  <Users size={16} className="me-2" /> Followers
                </span>
              }
            />
            <Tab
              eventKey="following"
              title={
                <span>
                  <UserCheck size={16} className="me-2" /> Following
                </span>
              }
            />
          </Tabs>

          {isTabLoading ? (
            <div className="text-center p-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <div>
              {tabContent.length > 0 ? (
                tabContent.map((item) => {
                  if (["events", "favorites", "joined"].includes(activeTab)) {
                    return <ProfileEventRow key={item._id} event={item} />;
                  }
                  if (["followers", "following"].includes(activeTab)) {
                    return <UserListRow key={item._id} user={item} />;
                  }
                  return null;
                })
              ) : (
                <div className="text-center text-muted p-5">
                  <p>Nessun contenuto da mostrare in questa sezione.</p>
                </div>
              )}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;