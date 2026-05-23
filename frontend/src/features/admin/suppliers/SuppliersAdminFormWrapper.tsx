import { useNavigate, useParams } from 'react-router-dom';
import { SuppliersAdminForm } from './SuppliersAdminForm';

export function SuppliersAdminFormWrapper() {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();

    return (
        <SuppliersAdminForm
            supplierId={id ?? null}
            onBack={() => navigate('/admin/proveedores')}
            onSuccess={() => navigate('/admin/proveedores')}
        />
    );
}