import React, { useState } from "react";

function ArchitectureDiagram() {
  return (
    <div className="architecture-diagram" aria-hidden style={{ margin: "1rem 0" }}>
      <svg viewBox="0 0 800 220" width="100%" height="220">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#0b6" />
          </marker>
        </defs>

        {/* Browser */}
        <rect x="20" y="40" width="140" height="80" rx="8" fill="#f4faf8" stroke="#cfeee7" />
        <text x="90" y="90" textAnchor="middle" fontSize="12">Browser / Client</text>

        {/* Arrow to CDN/API */}
        <line x1="160" y1="80" x2="260" y2="80" stroke="#9bd" strokeWidth="2" markerEnd="url(#arrow)" />

        {/* API Gateway */}
        <rect x="260" y="30" width="140" height="80" rx="8" fill="#fff8e8" stroke="#f1dca8" />
        <text x="330" y="60" textAnchor="middle" fontSize="12">API Gateway</text>
        <text x="330" y="76" textAnchor="middle" fontSize="11" fill="#666">REST / Webhook</text>

        {/* Arrow to Lambda */}
        <line x1="400" y1="80" x2="500" y2="80" stroke="#9bd" strokeWidth="2" markerEnd="url(#arrow)" />

        {/* Lambda */}
        <rect x="500" y="20" width="160" height="100" rx="8" fill="#eef7ff" stroke="#c6e0ff" />
        <text x="580" y="60" textAnchor="middle" fontSize="12">AWS Lambda</text>
        <text x="580" y="78" textAnchor="middle" fontSize="11" fill="#666">Business logic, Rekognition calls</text>

        {/* Down connections */}
        <line x1="580" y1="120" x2="580" y2="160" stroke="#9bd" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="520" y="160" width="120" height="40" rx="6" fill="#f7f7f7" stroke="#ddd" />
        <text x="580" y="185" textAnchor="middle" fontSize="11">DynamoDB (metadata)</text>

        <rect x="660" y="160" width="120" height="40" rx="6" fill="#f7f7f7" stroke="#ddd" />
        <text x="720" y="185" textAnchor="middle" fontSize="11">S3 (images, assets)</text>
      </svg>
    </div>
  );
}

function ServiceBadge({ service }) {
  const [logoVisible, setLogoVisible] = useState(Boolean(service.logo));

  return (
    <div className="about-service-badge" aria-hidden>
      {logoVisible ? (
        <img
          src={service.logo}
          alt=""
          className="about-service-logo"
          onError={() => setLogoVisible(false)}
        />
      ) : (
        <span className="about-service-emoji">{service.emoji}</span>
      )}
    </div>
  );
}

export default function About() {
  const [showImage, setShowImage] = useState(true);

  const services = [
    {
      id: "cognito",
      title: "Amazon Cognito",
      subtitle: "Authentication & SSO",
      description: "User authentication for lecturers and secure single sign-on.",
      logo: "/assets/aws/cognito.png",
      emoji: "🔑",
    },
    {
      id: "apigw",
      title: "Amazon API Gateway",
      subtitle: "Public API",
      description: "Exposes REST endpoints that route requests to Lambda functions.",
      logo: "/assets/aws/apigateway.png",
      emoji: "🌐",
    },
    {
      id: "lambda",
      title: "AWS Lambda",
      subtitle: "Serverless compute",
      description: "Runs business logic, coordinates Rekognition, and accesses databases.",
      logo: "/assets/aws/lambda.png",
      emoji: "🧠",
    },
    {
      id: "dynamodb",
      title: "Amazon DynamoDB",
      subtitle: "NoSQL metadata store",
      description: "Stores student records, attendance history and lookup tables.",
      logo: "/assets/aws/dynamodb.png",
      emoji: "🗄️",
    },
    {
      id: "s3",
      title: "Amazon S3",
      subtitle: "Object storage",
      description: "Holds uploaded images, model assets and exported CSV files.",
      logo: "/assets/aws/s3.png",
      emoji: "🗃️",
    },
    {
      id: "rekognition",
      title: "Amazon Rekognition",
      subtitle: "Face detection & matching",
      description: "Performs face analysis and identifications for attendance capture.",
      logo: "/assets/aws/rekognition.png",
      emoji: "👁️",
    },
    {
      id: "cloudwatch",
      title: "CloudWatch & IAM",
      subtitle: "Monitoring & access control",
      description: "Logs, metrics and fine-grained permissions for auditing and operations.",
      logo: "/assets/aws/cloudwatch-iam.png",
      emoji: "📈",
    },
    {
      id: "eventbridge",
      title: "Amazon EventBridge",
      subtitle: "Event routing",
      description: "Routes system events between services and triggers automated workflows.",
      logo: "/assets/aws/eventbridge.png",
      emoji: "🔄",
    },
    {
      id: "athena",
      title: "Amazon Athena",
      subtitle: "Serverless analytics",
      description: "Runs SQL queries on attendance data stored in S3 for analysis.",
      logo: "/assets/aws/athena.png",
      emoji: "🔎",
    },
    {
      id: "amplify",
      title: "AWS Amplify",
      subtitle: "Frontend hosting",
      description: "Builds and deploys the web app with integrated CI/CD and environment support.",
      logo: "/assets/aws/amplify.png",
      emoji: "🚀",
    },
  ];

  const features = [
    {
      id: "face",
      icon: "🧑‍🏫",
      title: "Face-based attendance",
      desc: "Fast, contactless attendance using face recognition.",
    },
    {
      id: "registry",
      icon: "📚",
      title: "Student registry",
      desc: "Register new student by uploading face image.",
    },
    {
      id: "overview",
      icon: "📊",
      title: "Daily overview",
      desc: "Quick summary of attendance and trends.",
    },
    {
      id: "export",
      icon: "⬇️",
      title: "CSV export",
      desc: "Export attendance records for reporting.",
    },
    {
      id: "sso",
      icon: "🔒",
      title: "Single Sign-On",
      desc: "Secure lecturer access via Cognito.",
    },
  ];

  return (
    <main className="page-shell">
      <section className="page-header about-header">
        <div>
          <h1>About</h1>
          <p className="hero-copy">Overview of system architecture, features, and AWS services used.</p>
        </div>
      </section>

      <section className="panel-card" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-header about-section-header">
          <h2>System Architecture</h2>
        </div>

        <div style={{ padding: "1rem 0" }}>
          {showImage ? (
            <img
              src="/assets/architecture.png"
              alt="Architecture diagram"
              style={{ maxWidth: "100%", height: "auto", borderRadius: 6 }}
              onError={() => setShowImage(false)}
            />
          ) : (
            <div>
              <ArchitectureDiagram />
              <p style={{ marginTop: "0.5rem" }}>
                To use a higher-fidelity diagram, upload an image as
                <strong> public/assets/architecture.png</strong> in the project.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="panel-card" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-header about-section-header">
          <h2>Key Features</h2>
        </div>
        <div style={{ padding: "0.5rem 0 1rem 0" }}>
          <div className="about-features">
            {features.map((feature) => (
              <article key={feature.id} className="about-feature-card">
                <div className="about-feature-row">
                  <div className="about-feature-icon" aria-hidden>
                    {feature.icon}
                  </div>
                  <div>
                    <strong className="about-feature-title">{feature.title}</strong>
                    <div className="about-feature-desc">{feature.desc}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-card" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-header about-section-header">
          <h2>AWS Services Used</h2>
        </div>

        <div className="about-services">
          {services.map((service) => (
            <article key={service.id} className="about-service-card">
              <div className="about-service-row">
                <ServiceBadge service={service} />
                <div>
                  <strong className="about-service-title">{service.title}</strong>
                  <div className="about-service-subtitle">{service.subtitle}</div>
                </div>
              </div>
              <p className="about-service-desc">{service.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
