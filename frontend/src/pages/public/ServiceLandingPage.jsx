import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import BlockRenderer from '../../components/BlockRenderer.jsx';
import { servicesApi } from '../../api/products.js';
import { BlockVariableContext } from '../../context/BlockVariableContext.jsx';
import { serviceVariableScope } from '../../lib/serviceVariables.js';
import { resolveWrapperMargin } from '../../lib/blockSpacing.js';

// Standalone sales/landing page for a service, built from the block canvas.
// Served on its own route so the service detail page stays driven by its
// structured fields (features, deliverables, tiers, FAQs).
export default function ServiceLandingPage() {
  const { serviceSlug } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadService();
  }, [serviceSlug]);

  const loadService = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await servicesApi.getById(serviceSlug);
      setService(data);
    } catch (err) {
      setError('Failed to load page');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page">
        <div className="container">
          <div className="skeleton-lines">
            <span style={{ height: '240px' }} />
            <span style={{ height: '400px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="landing-page">
        <div className="container">
          <div className="error-state">
            <AlertCircle size={48} />
            <h2>Page Not Found</h2>
            <p>The page you're looking for doesn't exist or has been removed.</p>
            <Link to="/" className="btn btn-primary">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const blocks = Array.isArray(service.blocks) ? service.blocks : [];

  return (
    <div className="landing-page">
      <div className="landing-body">
        <div className="container">
          {blocks.length === 0 ? (
            <div className="landing-empty">
              <h2>This landing page isn&apos;t built yet</h2>
              <p>
                Add content blocks to this service in the admin editor, or read
                the full details on the service page.
              </p>
              <Link to={`/services/${service.slug}`} className="btn btn-primary">
                View service details
              </Link>
            </div>
          ) : (
            <BlockVariableContext.Provider value={serviceVariableScope(service)}>
              <div className="blocks-render landing-render">
                {blocks.map((block, i) => (
                  <div
                    key={`${block.id}-${i}`}
                    className="block-wrapper"
                    style={{ margin: resolveWrapperMargin(block) }}
                  >
                    <BlockRenderer block={block} />
                  </div>
                ))}
              </div>
            </BlockVariableContext.Provider>
          )}
        </div>
      </div>
    </div>
  );
}
