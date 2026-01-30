'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import { Input } from '@saasfly/ui/input';
import { Label } from '@saasfly/ui/label';
import { DashboardShell } from '~/components/shell';

export default function BrandKitPage() {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
  const [accentColor, setAccentColor] = useState('#FF5733');
  const [headlineFont, setHeadlineFont] = useState('Inter');
  const [bodyFont, setBodyFont] = useState('Inter');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brandKits, setBrandKits] = useState<any[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

  // Load existing brand kits
  useEffect(() => {
    loadBrandKits();
  }, []);

  const loadBrandKits = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/brand-kits');
      if (response.ok) {
        const kits = await response.json();
        setBrandKits(kits);
        
        // Load first kit if available
        if (kits.length > 0) {
          loadBrandKit(kits[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load brand kits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrandKit = (kit: any) => {
    setSelectedKitId(kit.id);
    setName(kit.name || '');
    setHandle(kit.handle || '');
    
    if (kit.colors) {
      setPrimaryColor(kit.colors.primary || '#000000');
      setSecondaryColor(kit.colors.secondary || '#FFFFFF');
      setAccentColor(kit.colors.accent || '#FF5733');
    }
    
    if (kit.fonts) {
      setHeadlineFont(kit.fonts.headline || 'Inter');
      setBodyFont(kit.fonts.body || 'Inter');
    }
    
    if (kit.logoUrl) {
      setLogoPreview(kit.logoUrl);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a brand name');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (handle) formData.append('handle', handle);
      formData.append('colors', JSON.stringify({
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
      }));
      formData.append('fonts', JSON.stringify({
        headline: headlineFont,
        body: bodyFont,
      }));
      formData.append('isDefault', 'true');
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const url = selectedKitId 
        ? `/api/brand-kits/${selectedKitId}`
        : '/api/brand-kits';
      
      const method = selectedKitId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        const savedKit = await response.json();
        alert(selectedKitId ? 'Brand kit updated!' : 'Brand kit created!');
        loadBrandKits();
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save brand kit:', error);
      alert('Failed to save brand kit');
    } finally {
      setSaving(false);
    }
  };

  const handleNewKit = () => {
    setSelectedKitId(null);
    setName('');
    setHandle('');
    setPrimaryColor('#000000');
    setSecondaryColor('#FFFFFF');
    setAccentColor('#FF5733');
    setHeadlineFont('Inter');
    setBodyFont('Inter');
    setLogoFile(null);
    setLogoPreview('');
  };

  const handleDelete = async () => {
    if (!selectedKitId) return;
    
    if (!confirm('Are you sure you want to delete this brand kit?')) return;

    try {
      const response = await fetch(`/api/brand-kits/${selectedKitId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Brand kit deleted!');
        handleNewKit();
        loadBrandKits();
      } else {
        alert('Failed to delete brand kit');
      }
    } catch (error) {
      console.error('Failed to delete brand kit:', error);
      alert('Failed to delete brand kit');
    }
  };

  const fontOptions = [
    'Inter',
    'Lora',
    'Poppins',
    'Source Sans Pro',
    'Roboto Mono',
  ];

  return (
    <DashboardShell
      title="Brand Kit"
      description="Manage your brand identity for consistent carousels."
      className="space-y-6"
    >
      {/* Existing Brand Kits */}
      {brandKits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Brand Kits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brandKits.map((kit) => (
                <Button
                  key={kit.id}
                  variant={selectedKitId === kit.id ? 'default' : 'outline'}
                  onClick={() => loadBrandKit(kit)}
                >
                  {kit.name}
                </Button>
              ))}
              <Button variant="outline" onClick={handleNewKit}>
                + New Kit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brand Kit Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedKitId ? 'Edit Brand Kit' : 'Create Brand Kit'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name and Handle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name *</Label>
              <Input
                id="brand-name"
                data-testid="brand_name_input"
                placeholder="e.g., My Personal Brand"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-handle">Handle / Social Media</Label>
              <Input
                id="brand-handle"
                data-testid="brand_handle_input"
                placeholder="e.g., @myhandle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="w-20 h-20 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              <Input
                id="logo-upload"
                data-testid="logo_upload"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoChange}
                className="flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Supported formats: PNG, JPEG, SVG, WebP (max 5MB)
            </p>
          </div>

          {/* Color Palette */}
          <div className="space-y-3">
            <Label>Color Palette</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color" className="text-sm">Primary</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-color" className="text-sm">Secondary</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color" className="text-sm">Accent</Label>
                <div className="flex gap-2">
                  <Input
                    id="accent-color"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Font Selection */}
          <div className="space-y-3">
            <Label>Font Pair</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headline-font" className="text-sm">Headline Font</Label>
                <select
                  id="headline-font"
                  value={headlineFont}
                  onChange={(e) => setHeadlineFont(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="body-font" className="text-sm">Body Font</Label>
                <select
                  id="body-font"
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              data-testid="save_button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? 'Saving...' : selectedKitId ? 'Update Kit' : 'Create Kit'}
            </Button>
            {selectedKitId && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={saving}
              >
                Delete
              </Button>
            )}
            {selectedKitId && (
              <Button
                variant="outline"
                onClick={handleNewKit}
                disabled={saving}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 rounded-lg border-2"
            style={{ 
              backgroundColor: secondaryColor,
              borderColor: accentColor 
            }}
          >
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ 
                color: primaryColor,
                fontFamily: headlineFont 
              }}
            >
              {name || 'Your Brand Name'}
            </h2>
            <p 
              className="text-sm"
              style={{ 
                color: primaryColor,
                fontFamily: bodyFont 
              }}
            >
              {handle || '@yourhandle'}
            </p>
            {logoPreview && (
              <div className="mt-4 w-16 h-16 border rounded overflow-hidden">
                <img 
                  src={logoPreview} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
