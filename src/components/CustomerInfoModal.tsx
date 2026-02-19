import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

export interface CustomerBasicInfo {
    name: string;
    mobile: string;
    email: string;
    age: string; // Keep as string for input, convert to number on submit
    occupation: string;
    employmentType: string;
    city: string;
    preferredChannel: string;
}

interface CustomerInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CustomerBasicInfo) => void;
    initialData: {
        customerId: string;
        detectedName?: string;
        existingProfile?: Partial<CustomerBasicInfo>;
    };
}

const OCCUPATIONS = [
    "Engineer", "Teacher", "Student", "Business", "Laborer",
    "Doctor", "Freelancer", "Government Employee", "Private Employee", "Other"
];

const EMP_TYPES = ["Salaried", "Self-Employed", "Student", "Retired", "Unemployed"];
const CHANNELS = ["SMS", "Email", "Call", "App Notification"];

export function CustomerInfoModal({ isOpen, onClose, onSubmit, initialData }: CustomerInfoModalProps) {
    const [formData, setFormData] = useState<CustomerBasicInfo>({
        name: "",
        mobile: "",
        email: "",
        age: "",
        occupation: "",
        employmentType: "",
        city: "Pune", // Default
        preferredChannel: "SMS", // Default
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CustomerBasicInfo, string>>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: initialData.existingProfile?.name || initialData.detectedName || "Unknown Customer",
                mobile: initialData.existingProfile?.mobile || "",
                email: initialData.existingProfile?.email || "",
                age: initialData.existingProfile?.age?.toString() || "",
                occupation: initialData.existingProfile?.occupation || "",
                employmentType: initialData.existingProfile?.employmentType || "",
                city: initialData.existingProfile?.city || "Pune",
                preferredChannel: initialData.existingProfile?.preferredChannel || "SMS",
            });
            setErrors({});
        }
    }, [isOpen, initialData]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CustomerBasicInfo, string>> = {};
        let isValid = true;

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
            isValid = false;
        }

        if (!/^\d{10}$/.test(formData.mobile)) {
            newErrors.mobile = "Mobile must be exactly 10 digits";
            isValid = false;
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
            isValid = false;
        }

        const ageNum = parseInt(formData.age);
        if (!formData.age || isNaN(ageNum) || ageNum < 18 || ageNum > 70) {
            newErrors.age = "Age must be between 18 and 70";
            isValid = false;
        }

        if (!formData.occupation) {
            newErrors.occupation = "Occupation is required";
            isValid = false;
        }

        if (!formData.employmentType) {
            newErrors.employmentType = "Employment type is required";
            isValid = false;
        }

        if (!formData.city.trim()) {
            newErrors.city = "City is required";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Customer Basic Information</DialogTitle>
                    <DialogDescription>
                        Please fill in the required details for <strong>{initialData.customerId}</strong> before proceeding.
                        This information will be stored locally for prototype purposes.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customerId">Customer ID</Label>
                            <Input id="customerId" value={initialData.customerId} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Customer Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="mobile">Mobile Number <span className="text-red-500">*</span></Label>
                            <Input
                                id="mobile"
                                maxLength={10}
                                placeholder="10 digits"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                                className={errors.mobile ? "border-red-500" : ""}
                            />
                            {errors.mobile && <span className="text-xs text-red-500">{errors.mobile}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={errors.email ? "border-red-500" : ""}
                            />
                            {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="age">Age <span className="text-red-500">*</span></Label>
                            <Input
                                id="age"
                                type="number"
                                min={18}
                                max={70}
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                className={errors.age ? "border-red-500" : ""}
                            />
                            {errors.age && <span className="text-xs text-red-500">{errors.age}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className={errors.city ? "border-red-500" : ""}
                            />
                            {errors.city && <span className="text-xs text-red-500">{errors.city}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Occupation <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.occupation}
                                onValueChange={(val) => setFormData({ ...formData, occupation: val })}
                            >
                                <SelectTrigger className={errors.occupation ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {OCCUPATIONS.map((o) => (
                                        <SelectItem key={o} value={o}>{o}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.occupation && <span className="text-xs text-red-500">{errors.occupation}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label>Employment Type <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.employmentType}
                                onValueChange={(val) => setFormData({ ...formData, employmentType: val })}
                            >
                                <SelectTrigger className={errors.employmentType ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {EMP_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.employmentType && <span className="text-xs text-red-500">{errors.employmentType}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Preferred Contact Channel <span className="text-red-500">*</span></Label>
                        <Select
                            value={formData.preferredChannel}
                            onValueChange={(val) => setFormData({ ...formData, preferredChannel: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CHANNELS.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="flex space-x-2 sm:justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        Continue to Risk Scoring
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
