import React, { useState, useEffect, useCallback } from "react";
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

const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [tabContent, setTabContent] = useState([]);
  const [isTabLoading, setIsTabLoading] = useState(false);

  const handleFollowUpdate = useCallback((newFollowersCount) => {
    setProfileUser((prev) => ({ ...prev, followersCount: newFollowersCount }));
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
              <img
                src={profileUser.avatar}
                alt={profileUser.name}
                className="rounded-circle mb-3"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
              <h4 className="fw-bold">{profileUser.name}</h4>
              <p className="text-muted mb-1">
                {profileUser.role.charAt(0).toUpperCase() +
                  profileUser.role.slice(1)}
              </p>
              <p className="text-muted">
                <MapPin size={14} />{" "}
                {profileUser.location?.city || "Nessuna località"}
              </p>

              {isOwnProfile ? (
                <Button as={Link} to="/my-ritmo" variant="primary">
                  Modifica Profilo
                </Button>
              ) : (
                <div className="d-grid col-8 mx-auto">
                  <FollowButton
                    targetUser={profileUser}
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
