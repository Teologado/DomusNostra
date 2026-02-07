import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
    title: string;
    description: string;
    imageUrl: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ title, description, imageUrl }) => {
    return (
        <div className="glass-card">
            <img src={imageUrl} alt={title} className="glass-card-image" />
            <div className="glass-card-content">
                <h2 className="glass-card-title">{title}</h2>
                <p className="glass-card-description">{description}</p>
            </div>
        </div>
    );
};

export default GlassCard;
