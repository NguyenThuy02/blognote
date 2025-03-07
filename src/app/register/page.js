"use client";
import { useForm } from "react-hook-form";
import React from 'react';

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    console.log(data);
    // Gửi yêu cầu tới API
    // await axios.post('/api/register', data);
  };

  const handleCancel = () => {
    reset();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-300 to-purple-300">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm p-8 px-12 rounded-2xl shadow-lg bg-stone-50 relative"
      >
        {/* Rest of your form code */}
        {/* ... */}
      </form>
    </div>
  );
} 