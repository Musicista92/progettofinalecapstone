import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import FollowButton from "./FollowButton";

const UserListRow = ({ user }) => {
  if (!user) return null;

  return (
    <Card className="mb-2 border-0 border-bottom rounded-0">
      <Card.Body>
        <Row className="align-items-center">
          <Col xs="auto">
            <Link to={`/users/${user._id}`}>
              <img
                src={user.avatar}
                alt={user.name}
                className="rounded-circle"
                style={{ width: "50px", height: "50px", objectFit: "cover" }}
              />
            </Link>
          </Col>
          <Col>
            <Link
              to={`/users/${user._id}`}
              className="text-decoration-none text-dark"
            >
              <h6 className="fw-bold mb-0">{user.name}</h6>
            </Link>
            <p className="text-muted small mb-0">
              {user.bio?.substring(0, 50) || "Nessuna bio"}
              {user.bio?.length > 50 && "..."}
            </p>
          </Col>
          <Col xs="auto">
            {/* Pulsante Segui per azioni rapide dalla lista */}
            <FollowButton targetUser={user} />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default UserListRow;
