import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactPage } from '../ContactPage';
import { describe, it, expect } from 'vitest';

describe('ContactPage', () => {
  it('keeps submit button disabled initially and shows validation errors on blur', async () => {
    render(<ContactPage />);
    
    const submitButton = screen.getByRole('button', { name: /Enviar por correo/i });
    
    // 1. Verificamos que el botón esté deshabilitado (nuestra nueva feature)
    expect(submitButton).toBeDisabled();

    // 2. Obtenemos los inputs
    const nameInput = screen.getByLabelText(/Nombre y apellido/i);
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    const messageInput = screen.getByLabelText(/Mensaje/i);

    // 3. Simulamos que el usuario entra y sale de los campos sin escribir nada (blur)
    await userEvent.click(nameInput);
    await userEvent.click(emailInput);
    await userEvent.click(messageInput);
    await userEvent.click(document.body);

    // 4. Verificamos que aparezcan los mensajes de error
    expect(screen.getByText(/Ingresá tu nombre y apellido/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingresá tu correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingresá tu mensaje/i)).toBeInTheDocument();
  });

  it('shows an email validation error when the email format is invalid', async () => {
    render(<ContactPage />);
    
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    
    await userEvent.type(emailInput, 'correo-invalido');
    await userEvent.click(document.body); // blur

    expect(screen.getByText(/Ingresá un correo válido/i)).toBeInTheDocument();
  });
  
  it('enables the submit button when all required fields are filled correctly', async () => {
    render(<ContactPage />);
    
    const nameInput = screen.getByLabelText(/Nombre y apellido/i);
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    const messageInput = screen.getByLabelText(/Mensaje/i);
    const submitButton = screen.getByRole('button', { name: /Enviar por correo/i });

    // Llenamos los datos correctamente
    await userEvent.type(nameInput, 'Juan Perez');
    await userEvent.type(emailInput, 'juan@perez.com');
    await userEvent.type(messageInput, 'Hola, necesito ayuda con mi pedido.');

    // El botón debería habilitarse
    expect(submitButton).toBeEnabled();
  });
});