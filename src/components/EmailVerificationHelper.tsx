import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, ExternalLink, CheckCircle, Copy } from 'lucide-react';

export function EmailVerificationHelper() {
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlQuery = "UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email_confirmed_at IS NULL;";

  const copySQL = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-red-300 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <AlertCircle className="w-5 h-5" />
          🚨 Desactiva Verificación de Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded border border-red-200">
          <p className="text-sm text-red-800 mb-3">
            <strong>Problema:</strong> Supabase pide confirmación de email y por eso el login no funciona.
          </p>
          <p className="text-sm text-red-800">
            <strong>Solución:</strong> Desactívalo en Supabase (30 segundos)
          </p>
        </div>

        {/* Step 1 */}
        <div className="bg-white p-4 rounded border-2 border-blue-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {step1Done ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <span className="text-blue-900">1</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Desactiva "Enable email confirmations"
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-2"
                onClick={() => {
                  window.open('https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/auth/url-configuration', '_blank');
                  setStep1Done(true);
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Configuración de Email
              </Button>
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <strong>Qué hacer:</strong>
                <ol className="ml-4 mt-1 space-y-1 list-decimal">
                  <li>Busca: "Enable email confirmations"</li>
                  <li>Haz click para desactivarlo (sin ✓)</li>
                  <li>Scroll abajo y click en "Save"</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-4 rounded border-2 border-green-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              {step2Done ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <span className="text-green-900">2</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Ejecuta este SQL
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-2"
                onClick={() => {
                  window.open('https://supabase.com/dashboard/project/sxjnlaoumttaglgbcyww/sql/new', '_blank');
                  setStep2Done(true);
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir SQL Editor
              </Button>
              <div className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-gray-700">Copia este SQL:</strong>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copySQL}
                    className="h-6 px-2"
                  >
                    {copied ? (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs overflow-x-auto">
                  {sqlQuery}
                </code>
                <p className="text-gray-600 mt-2">
                  <strong>Qué hacer:</strong> Pega el SQL y click en "RUN"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Check */}
        {step1Done && step2Done && (
          <div className="bg-green-50 border-2 border-green-400 p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-900">¡Casi listo!</h3>
            </div>
            <p className="text-sm text-green-800 mb-3">
              Si completaste ambos pasos:
            </p>
            <ol className="text-sm text-green-800 ml-4 space-y-1 list-decimal">
              <li>Recarga esta página (F5)</li>
              <li>Intenta hacer login</li>
              <li>Deberías entrar sin problemas ✅</li>
            </ol>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          📖 Más info en: <code className="bg-gray-100 px-1 py-0.5 rounded">DESACTIVAR_EMAIL.md</code>
        </div>
      </CardContent>
    </Card>
  );
}
