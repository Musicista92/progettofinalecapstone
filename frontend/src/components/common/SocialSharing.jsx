/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { Dropdown } from "react-bootstrap";
import { Share2, Copy } from "lucide-react";
import { FaTwitter, FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

//aggiusta problemi di posizionamento
const popperConfig = {
  modifiers: [
    {
      name: "flip",
      options: {
        fallbackPlacements: [],
      },
    },
  ],
};

const SocialSharing = ({
  event,
  url = window.location.href,
  hashtags = ["RitmoEvents", "Salsa", "Bachata"],
}) => {
  const eventTitle = event?.title || "Unisciti a questo fantastico evento!";
  const shareText = `Dai un'occhiata a questo evento: ${eventTitle}!`;

  // Url di condivisione
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}&hashtag=%23${encodeURIComponent(hashtags[0] || "RitmoEvents")}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(
      hashtags.join(",")
    )}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(
      shareText + " " + url
    )}`,
    email: `mailto:?subject=${encodeURIComponent(
      eventTitle
    )}&body=${encodeURIComponent(
      shareText + "\n\nTrovi i dettagli qui: " + url
    )}`,
  };

  const openShareWindow = (shareUrl) => {
    window.open(
      shareUrl,
      "share",
      "width=600,height=400,scrollbars=yes,resizable=yes"
    );
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiato negli appunti!");
    } catch (error) {
      console.error("Errore nel copiare il link:", error);
      toast.error("Impossibile copiare il link.");
    }
  };

  return (
    <Dropdown
      drop="up"
      className="social-dropdown"
      strategy="fixed"
      popperConfig={popperConfig}
    >
      <Dropdown.Toggle
        variant="outline-primary"
        size="sm"
        className="d-flex align-items-center w-100 justify-content-center"
      >
        <Share2 size={16} className="me-2" />
        Condividi
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => openShareWindow(shareUrls.twitter)}>
          <FaTwitter size={16} className="me-2" style={{ color: "#1DA1F2" }} />
          Twitter
        </Dropdown.Item>

        <Dropdown.Item onClick={() => openShareWindow(shareUrls.whatsapp)}>
          <FaWhatsapp size={16} className="me-2" style={{ color: "#25D366" }} />
          WhatsApp
        </Dropdown.Item>

        <Dropdown.Divider />

        <Dropdown.Item onClick={copyToClipboard}>
          <Copy size={16} className="me-2" />
          Copia Link
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default SocialSharing;

// Utility function for social media meta tags
export const getSocialMetaTags = (event) => {
  if (!event) return {};

  const eventId = event._id || event.id;
  const eventTitle = event.title || "Evento";
  const eventDescription = event.description || "Partecipa a questo evento!";
  const eventImage = event.image || "";

  return {
    title: eventTitle,
    description: eventDescription,
    image: eventImage,
    url: `${window.location.origin}/events/${eventId}`,
    type: "website",
    site_name: "RitmoCaribe",
    // Open Graph tags
    "og:title": eventTitle,
    "og:description": eventDescription,
    "og:image": eventImage,
    "og:url": `${window.location.origin}/events/${eventId}`,
    "og:type": "website",
    "og:site_name": "RitmoCaribe",
    // Twitter Card tags
    "twitter:card": "summary_large_image",
    "twitter:title": eventTitle,
    "twitter:description": eventDescription,
    "twitter:image": eventImage,
  };
};
