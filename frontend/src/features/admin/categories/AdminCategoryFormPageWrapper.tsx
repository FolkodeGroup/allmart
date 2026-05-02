import { useNavigate, useParams } from 'react-router-dom';
import { AdminCategoryFormPage } from './AdminCategoryFormPage';

export function AdminCategoryFormPageWrapper() {
    const navigate = useNavigate();
    const { categoryId } = useParams<{ categoryId?: string }>();

    const handleBack = () => {
        navigate('/admin/categorias');
    };

    const handleSuccess = () => {
        navigate('/admin/categorias');
    };

    return (
        <AdminCategoryFormPage
            categoryId={categoryId ?? null}
            onBack={handleBack}
            onSuccess={handleSuccess}
        />
    );
}
