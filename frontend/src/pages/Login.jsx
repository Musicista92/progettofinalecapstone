import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Music } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email è richiesta";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email non valida";
    }

    if (!formData.password) {
      newErrors.password = "Password è richiesta";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password deve essere di almeno 6 caratteri";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData);
      if (result.success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role) => {
    const demoCredentials = {
      admin: { email: "admin@example.com", password: "password123" },
      organizer: { email: "organizer@example.com", password: "password123" },
      user: { email: "giulia@example.com", password: "password123" },
    };

    setFormData(demoCredentials[role]);
    setErrors({});
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="card-custom shadow-hover">
            <Card.Body className="p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <Music size={48} className="text-primary" />
                </div>
                <h2 className="fw-bold">Bentornato!</h2>
                <p className="text-muted">
                  Accedi per continuare a vivere il ritmo caraibico
                </p>
              </div>

              {/* Demo Credentials Alert */}
              <Alert variant="info" className="mb-4">
                <strong>🧪 Demo Credentials:</strong>
                <div className="mt-2 d-flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => fillDemoCredentials("admin")}
                  >
                    Admin
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-success"
                    onClick={() => fillDemoCredentials("organizer")}
                  >
                    Organizer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => fillDemoCredentials("user")}
                  >
                    User
                  </Button>
                </div>
                <small className="d-block mt-2 text-muted">
                  Password per tutti: <code>password123</code>
                </small>
              </Alert>

              {/* Login Form */}
              <Form onSubmit={handleSubmit} className="form-custom">
                {/* Email Field */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <Mail size={16} className="me-2" />
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Inserisci la tua email"
                    isInvalid={!!errors.email}
                    autoComplete="email"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Password Field */}
                <Form.Group className="mb-4">
                  <Form.Label>
                    <Lock size={16} className="me-2" />
                    Password
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Inserisci la tua password"
                      isInvalid={!!errors.password}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y pe-3"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ border: "none", background: "none" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Remember Me & Forgot Password */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check
                    type="checkbox"
                    label="Ricordami"
                    id="remember-me"
                  />
                  <Link
                    to="/forgot-password"
                    className="text-decoration-none small"
                  >
                    Password dimenticata?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="btn-primary-custom w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? "Accesso in corso..." : "Accedi"}
                </Button>

                {/* Register Link */}
                <div className="text-center">
                  <span className="text-muted">Non hai un account? </span>
                  <Link
                    to="/register"
                    className="text-decoration-none fw-semibold"
                  >
                    Registrati qui
                  </Link>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Social Login (Future Feature) */}
          <Card className="card-custom mt-3">
            <Card.Body className="text-center py-3">
              <small className="text-muted">
                🚀 Presto disponibile: Login con Google e Facebook
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
