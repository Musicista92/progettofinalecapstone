import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    bio: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Nome è richiesto";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nome deve essere di almeno 2 caratteri";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email è richiesta";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email non valida";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password è richiesta";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password deve essere di almeno 6 caratteri";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Conferma password è richiesta";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Le password non corrispondono";
    }

    // Bio validation (optional but with limit)
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "Bio non può superare i 500 caratteri";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register({
        name: registrationData.name.trim(),
        email: registrationData.email,
        password: registrationData.password,
        role: registrationData.role,
        bio: registrationData.bio.trim(),
      });
      if (result.success) {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ form: "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  console.log("ERRORS", errors);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="card-custom shadow-hover">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <div className="mb-3">
                  <UserPlus size={48} className="text-primary" />
                </div>
                <h2 className="fw-bold">Unisciti a RitmoCaribe!</h2>
                <p className="text-muted">
                  Crea il tuo account e inizia a vivere la passione caraibica
                </p>
              </div>

              <Form noValidate onSubmit={handleSubmit} className="form-custom">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <User size={16} />
                        Nome Completo *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Il tuo nome completo"
                        isInvalid={!!errors.name}
                        autoComplete="name"
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <Mail size={16} />
                        Email *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="la-tua-email@esempio.com"
                        isInvalid={!!errors.email}
                        autoComplete="email"
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <Lock size={16} />
                        Password *
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Almeno 6 caratteri"
                          isInvalid={!!errors.password}
                          autoComplete="new-password"
                          disabled={loading}
                        />
                        <Button
                          variant="link"
                          className="password-toggle-icon"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <Lock size={16} />
                        Conferma Password *
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Ripeti la password"
                          isInvalid={!!errors.confirmPassword}
                          autoComplete="new-password"
                          disabled={loading}
                        />
                        <Button
                          variant="link"
                          className="password-toggle-icon"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={loading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.confirmPassword}
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                {/* *** ROLE SELECTION *** */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    Che tipo di utente sei?
                  </Form.Label>
                  <div className="role-selection-group">
                    {["user", "organizer", "instructor"].map((role) => (
                      <div key={role} className="role-option">
                        <Form.Check
                          type="radio"
                          name="role"
                          id={`role-${role}`}
                          value={role}
                          checked={formData.role === role}
                          onChange={handleChange}
                          disabled={loading}
                          label={
                            <>
                              <span className="role-title">
                                {role === "user" && "🕺 Ballerino/a"}
                                {role === "organizer" && "🎵 Organizzatore/ice"}
                                {role === "instructor" && "👨‍🏫 Istruttore/ice"}
                              </span>
                              <small className="role-description text-muted d-block">
                                {role === "user" &&
                                  "Partecipa agli eventi e connettiti con la community"}
                                {role === "organizer" &&
                                  "Crea e gestisci eventi di danza"}
                                {role === "instructor" &&
                                  "Insegna e organizza workshop"}
                              </small>
                            </>
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Presentati brevemente (opzionale)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Racconta qualcosa di te, la tua esperienza con la danza caraibica..."
                    isInvalid={!!errors.bio}
                    maxLength={500}
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    {formData.bio.length}/500 caratteri
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.bio}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="terms-privacy"
                    required
                    disabled={loading}
                    label={
                      <span>
                        Accetto i{" "}
                        <Link
                          to="/terms"
                          target="_blank"
                          className="text-decoration-none"
                        >
                          Termini di Servizio
                        </Link>{" "}
                        e la{" "}
                        <Link
                          to="/privacy"
                          target="_blank"
                          className="text-decoration-none"
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    }
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="btn-primary-custom w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                      Registrazione in corso...
                    </>
                  ) : (
                    "Crea Account"
                  )}
                </Button>

                <div className="text-center">
                  <span className="text-muted">Hai già un account? </span>
                  <Link
                    to="/login"
                    className="text-decoration-none fw-semibold"
                  >
                    Accedi qui
                  </Link>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <Card className="card-custom mt-4">
            <Card.Body className="text-center py-4">
              <h6 className="mb-3">🎉 Vantaggi dell'iscrizione</h6>
              <Row className="text-start">
                <Col xs={6}>
                  <small className="d-block mb-2">
                    ✅ Salva eventi nei preferiti
                  </small>
                  <small className="d-block mb-2">
                    ✅ Ricevi promemoria via email
                  </small>
                  <small className="d-block mb-2">
                    ✅ Commenta e valuta eventi
                  </small>
                </Col>
                <Col xs={6}>
                  <small className="d-block mb-2">✅ Segui organizzatori</small>
                  <small className="d-block mb-2">
                    ✅ Crea il tuo profilo personale
                  </small>
                  <small className="d-block mb-2">
                    ✅ Connettiti con la community
                  </small>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
