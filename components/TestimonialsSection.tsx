import Image from 'next/image';

export default function TestimonialsSection() {
    const testimonials = [
        {
            text: "This AI comic generator is amazing! I created a Star Wars comic where I'm a Jedi knight. The quality is incredible and my friends loved it. Best comic book maker I've ever used!",
            name: "Sarah Johnson",
            role: "Graphic Designer",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
        },
        {
            text: "As a manga fan, I've always wanted to create my own manga online. This AI comic creator made it possible! The manga style is authentic and the story generation feature is brilliant.",
            name: "Thomas Bergman",
            role: "Software Engineer",
            image: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&h=100&fit=crop"
        },
        {
            text: "As a teacher, I use this AI comic creator to make educational comics for my students. They love seeing themselves as manga characters in our lessons. Perfect comic book generator for education!",
            name: "Léa Dubois",
            role: "Middle School Teacher",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
        },
        {
            text: "This AI comic generator is incredibly smart! It captured my personality perfectly. I've created three different comic books already using this manga creator and each one is unique and special.",
            name: "Jordan Mitchell",
            role: "Freelance Illustrator",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
        },
        {
            text: "I've always wanted to be in a Star Wars-style adventure. This comic book maker made it happen! The AI-generated artwork is stunning and the story integration is seamless.",
            name: "Marcus Chen",
            role: "Product Manager",
            image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop"
        },
        {
            text: "The high-resolution output from this comic book maker is perfect for printing. I ordered the physical book and it looks professional. My friends can't believe I created my own comic book!",
            name: "Sofia Andersson",
            role: "Marketing Specialist",
            image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop"
        },
        {
            text: "Creating a romantic manga with my partner as characters was the best anniversary gift idea ever! This AI comic generator made it so easy. The manhwa style is gorgeous!",
            name: "Nina Kowalski",
            role: "Content Writer",
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop"
        },
        {
            text: "I created a DBZ-style manga using this AI comic creator where I'm a Saiyan warrior. The attention to detail and art style matching is incredible. Living my childhood dream with this comic book generator!",
            name: "Yuki Tanaka",
            role: "UX Designer",
            image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop"
        },
        {
            text: "The high-resolution output from this comic book maker is perfect for printing. I ordered the physical book and it looks professional. My friends can't believe I created my own comic book!",
            name: "Sofia Andersson",
            role: "Marketing Specialist",
            image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop"
        }
    ];

    return (
        <section id="testimonials" className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-black text-center mb-16 font-display">
                WHAT OUR USERS SAY
            </h2>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                    <div key={index} className="relative pb-4">
                        <div className="relative bg-white border-[3px] border-black rounded-3xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <span key={i} className="text-yellow-400 text-lg">★</span>
                                ))}
                            </div>
                            <p className="text-sm leading-relaxed font-medium">
                                {testimonial.text}
                            </p>
                            <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-r-[3px] border-b-[3px] border-black transform rotate-45"></div>
                        </div>
                        <div className="flex items-center gap-3 mt-5 ml-3">
                            <Image
                                src={testimonial.image}
                                alt="Testimonial"
                                width={48}
                                height={48}
                                className="rounded-full border-[3px] border-black object-cover"
                            />
                            <div>
                                <p className="font-black text-sm">{testimonial.name}</p>
                                <p className="text-xs text-gray-600">{testimonial.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
