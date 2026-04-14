import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Box,
  Stack
} from '@mui/material';

interface VariantEditModalProps {
  open: boolean;
  initialName: string;
  initialValues: string[];
  onClose: () => void;
  onSave: (name: string, values: string[]) => void;
}

export function VariantEditModal({ open, initialName, initialValues, onClose, onSave }: VariantEditModalProps) {
  const [name, setName] = useState(initialName);
  const [values, setValues] = useState<string[]>(initialValues);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    if (values.includes(newValue.trim())) {
      setError('Valor duplicado');
      return;
    }
    setValues([...values, newValue.trim()]);
    setNewValue('');
    setError('');
  };

  const handleDeleteValue = (val: string) => {
    setValues(values.filter(v => v !== val));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    onSave(name.trim(), values);
    setError('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar variante</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <TextField
            label="Nombre del grupo"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            autoFocus
          />
          <Box>
            <TextField
              label="Nuevo valor"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddValue()}
              size="small"
              sx={{ mr: 1 }}
            />
            <Button variant="contained" onClick={handleAddValue} size="small">Agregar valor</Button>
          </Box>
          <Box sx={{ mt: 1 }}>
            {values.map(val => (
              <Chip
                key={val}
                label={val}
                onDelete={() => handleDeleteValue(val)}
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
          {error && <Box color="error.main">{error}</Box>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
