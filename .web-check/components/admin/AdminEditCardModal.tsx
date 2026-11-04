"use client";

import { useState } from "react";
import { CardSummary } from "./AdminCardsList";
import { useFile } from "../../app/context/FileContext";

interface AdminEditCardModalProps {
  card: CardSummary;
  adminToken: string;
  onClose: () => void;
  onSuccess: (updatedCard: CardSummary) => void;
}

export default function AdminEditCardModal({ card, adminToken, onClose, onSuccess }: AdminEditCardModalProps) {
  const { refreshAccessToken } = useFile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    restaurantName: card.restaurantName || "",
    phoneNumber: card.phoneNumber || "",
    clientName: card.clientName || "",
    userName: card.userName || "",
    workDone: card.workDone || "",
    amountReceived: card.amountReceived || "",
    themeId: card.themeId || "theme-1",
  });
  
  const [existingMenu, setExistingMenu] = useState<string[]>(card.menuImages || []);
  const [file, setFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [menu, setMenu] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "file" && e.target.files) setFile(e.target.files[0]);
    if (e.target.name === "logo" && e.target.files) setLogo(e.target.files[0]);
    if (e.target.name === "menu" && e.target.files) setMenu(e.target.files);
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5500";
    let token = adminToken;

    try {
      let res = await fetch(`${apiUrl}/cards/${card.slug}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          token = newToken;
          res = await fetch(`${apiUrl}/cards/${card.slug}`, {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          });
        }
      }

      if (!res.ok) {
        throw new Error("Échec de la mise à jour");
      }

      const updatedCard = await res.json();
      onSuccess(updatedCard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex",
      alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "24px",
        width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Éditer la carte #{card.slug}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>

        {error && <div style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Image Principale actuelle</label>
              {card.imageUrl ? <img src={card.imageUrl} style={{ height: "40px", borderRadius: "4px", marginBottom: "8px" }} /> : <span style={{fontSize:"11px"}}>Aucune</span>}
              <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Nouvelle Image Principale</label>
              <input type="file" name="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: "12px", width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Logo actuel</label>
              {card.logoUrl ? <img src={card.logoUrl} style={{ height: "40px", borderRadius: "4px", marginBottom: "8px" }} /> : <span style={{fontSize:"11px"}}>Aucun</span>}
              <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Nouveau Logo</label>
              <input type="file" name="logo" accept="image/*" onChange={handleFileChange} style={{ fontSize: "12px", width: "100%" }} />
            </div>
          </div>
          <div>
              <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Images du Menu actuelles (Cliquer pour supprimer)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {existingMenu.length > 0 ? existingMenu.map(url => (
                  <div key={url} style={{ position: "relative" }}>
                    <img src={url} style={{ height: "50px", borderRadius: "4px", border: "1px solid #ccc" }} />
                    <button type="button" onClick={() => setExistingMenu(prev => prev.filter(u => u !== url))} style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", borderRadius: "50%", border: "none", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer" }}>✕</button>
                  </div>
                )) : <span style={{fontSize:"11px", color:"#666"}}>Aucune image actuellement</span>}
              </div>
              
              <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Ajouter de Nouvelles Images</label>
              <input type="file" name="menu" accept="image/*" multiple onChange={handleFileChange} style={{ fontSize: "12px", width: "100%" }} />
          </div>
          <button type="submit" disabled={isSubmitting} style={{ background: "var(--orange)", color: "#fff", padding: "12px", borderRadius: "8px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: "bold", marginTop: "12px" }}>{isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}</button>
        </form>
      </div>
    </div>
  );
}
