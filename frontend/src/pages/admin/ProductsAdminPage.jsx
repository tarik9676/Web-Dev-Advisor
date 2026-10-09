import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Globe } from 'lucide-react';
import { productsApi } from '../../api/products';
import { useApp } from '../../context/AppContext.jsx';
import Header from '../../components/Header.jsx';

function ProductRow({ product, onEdit, onDelete, onView }) {
  const category = product.category?.name || product.category || 'Uncategorized';
  return (
    <tr>
      <td>
        <strong>{product.name}</strong>
        <br />
        <small>{category}</small>
      </td>
      <td>{product.short_description?.slice(0, 80) || ''}</td>
      <td>{product.starting_price || product.price || ''}</td>
      <td>
        <span className={`status-badge ${product.status === 'active' ? '' : product.status === 'draft' ? 'draft' : 'archived'}`}>
          {product.status}
        </span>
      </td>
      <td>
        <div className="inline-actions">
          <button className="button secondary" onClick={() => onView(product.slug)} title="View public page" type="button">
            <Globe size={14} />
          </button>
          <button className="button secondary" onClick={() => onEdit(product)} title="Edit" type="button">
            <Edit size={14} />
          </button>
          <button className="button secondary danger" onClick={() => onDelete(product.id)} title="Delete" type="button">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProductsAdminPage() {
  const { projectId, projects, selectProject, loadProject } = useApp();
  const project = projects.find((item) => String(item.id) === String(projectId)) || projects[0];
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleProjectChange = (event) => {
    const id = event.target.value;
    selectProject(id);
    loadProject(id);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll({});
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/app/admin/products/new');
  };

  const handleEdit = (product) => {
    navigate(`/app/admin/products/${product.slug}/edit`);
  };

  const handleView = (slug) => {
    window.open(`/products/${slug}`, '_blank');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    try {
      await productsApi.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton-table">
          <div className="skeleton-row">
            <span /><span /><span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page products-admin-page">
      <Header project={project} onProjectChange={handleProjectChange} projects={projects} />
      <div className="page-heading">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Products</h1>
          <p>Manage products and their page content</p>
        </div>
        <button className="button primary" onClick={handleCreate} type="button">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {error && <div className="toast toast-error">{error}</div>}

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Price</th>
                <th>Status</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="state-panel">
                    No products yet. Click "Add Product" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}