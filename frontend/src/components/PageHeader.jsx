export default function PageHeader({ title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        <span className="page-eyebrow">Administration</span>
        <h2>{title}</h2>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
