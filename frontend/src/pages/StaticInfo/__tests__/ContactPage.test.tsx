import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactPage } from '../ContactPage';

describe('ContactPage', () => {
  it('shows inline validation errors and focuses the first invalid field when submitting empty required fields', async () => {
    render(<ContactPage />);

    const submitButton = screen.getByRole('button', { name: /Enviar por correo/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/Ingresá tu nombre y apellido/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingresá tu correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingresá tu mensaje/i)).toBeInTheDocument();

    const fullNameInput = screen.getByLabelText(/Nombre y apellido/i);
    expect(fullNameInput).toHaveFocus();
  });

  it('shows an email validation error when the email format is invalid', async () => {
    render(<ContactPage />);

    const fullNameInput = screen.getByLabelText(/Nombre y apellido/i);
    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    const messageInput = screen.getByLabelText(/Mensaje/i);
    const submitButton = screen.getByRole('button', { name: /Enviar por correo/i });

    await userEvent.type(fullNameInput, 'Federico Paal');
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(messageInput, 'Este es un mensaje válido.');

    await userEvent.click(submitButton);

    const emailError = await screen.findByText(/Ingresá un correo válido/i);
    expect(emailError).toBeInTheDocument();
    expect(emailInput).toHaveFocus();
  });
});
