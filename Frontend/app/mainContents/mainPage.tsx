import ImageSlider from "../components/sliderComponent";

export default function MainPage() {
  return (
    <>
    <div className="flex flex-col lg:flex-row min-h-screen pt-16"> {/* Added pt-16 for padding-top */}
      <div className="w-full lg:w-1/2 p-8 text-gray-600">
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Labore delectus excepturi necessitatibus quis odio sunt assumenda, earum vero! Voluptas blanditiis sint nemo a amet maxime?
      </div>
      <div className="w-full lg:w-1/2 p-8">
        <ImageSlider />
      </div>
    </div>
    </>
  );
}