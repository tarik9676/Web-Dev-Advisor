import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import BlockRenderer from '../../components/BlockRenderer.jsx';
import { productsApi } from '../../api/products.js';
import { BlockVariableContext } from '../../context/BlockVariableContext.jsx';
import { productVariableScope } from '../../lib/productVariables.js';
import { resolveWrapperMargin } from '../../lib/blockSpacing.js';

// Standalone sales/landing page for a product, built from the block canvas.
// Served on its own route so the product detail page stays driven by its
// structured fields and description.
export default function ProductLandingPage() {
  const { productSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProduct();
  }, [productSlug]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi.getById(productSlug);
      setProduct(data);
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

  if (error || !product) {
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

  const blocks = Array.isArray(product.blocks) ? product.blocks : [];

  return (
    <div className="landing-page">
      <div className="landing-body">
        <div className="container">
          {blocks.length === 0 ? (
            <div className="landing-empty">
              <h2>This landing page isn&apos;t built yet</h2>
              <p>
                Add content blocks to this product in the admin editor, or read
                the full details on the product page.
              </p>
              <Link to={`/products/${product.slug}`} className="btn btn-primary">
                View product details
              </Link>
            </div>
          ) : (
            <BlockVariableContext.Provider value={productVariableScope(product)}>
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